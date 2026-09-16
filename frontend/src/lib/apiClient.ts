/** Client HTTP único — centraliza header de autenticação e parse de erro
 * (o backend sempre responde erro como {"detail": ...}). */
import {
  type AlunoDaOka,
  type LoginPayload,
  type LoginResponse,
  type MacuAvatar,
  type CadastroPayload,
  type EntrarOkaResponse,
  type Itas,
  type MensagemChat,
  type Nota,
  type Presenca,
  type NotaPayload,
  type Oka,
  type OkaPessoal,
  type Progresso,
  type ProgressoAluno,
  type RekoAggregate,
  type RekoCheckin,
  type RekoCheckinPayload,
  type Tema,
  type TemaDetalhe,
  type Usuario,
  type VideoSugerido,
} from '../types/api'
import { obterToken } from './authStorage'

// Em dev, caminho relativo + proxy do Vite (vite.config.ts) resolve pro
// backend local. Em produção (frontend e backend em domínios Vercel
// separados) não há proxy, então precisa da URL absoluta do backend.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface OpcoesRequisicao {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  autenticado?: boolean
}

function extrairMensagemDeErro(dados: unknown): string | null {
  if (!dados || typeof dados !== 'object' || !('detail' in dados)) return null
  const detail = (dados as { detail: unknown }).detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    // Erro de validação do Pydantic: lista de {loc, msg, ...}
    return detail
      .map((item) => (item && typeof item === 'object' && 'msg' in item ? String(item.msg) : null))
      .filter(Boolean)
      .join(' ')
  }

  return null
}

async function requisitar<T>(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const { method = 'GET', body, autenticado = true } = opcoes

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (autenticado) {
    const token = obterToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let resposta: Response
  try {
    // no-store: são respostas de API, não recurso estático — cache de HTTP
    // do navegador aqui só causa dado desatualizado sem aviso nenhum.
    resposta = await fetch(`${API_BASE_URL}${caminho}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
  } catch {
    throw new ApiError('Não foi possível falar com o servidor. Verifique sua conexão.', 0)
  }

  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => null)
    const mensagem = extrairMensagemDeErro(dados) ?? `Algo deu errado (${resposta.status}). Tente de novo.`
    throw new ApiError(mensagem, resposta.status)
  }

  if (resposta.status === 204) return undefined as T
  return (await resposta.json()) as T
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authApi = {
  cadastrar: (dados: CadastroPayload) =>
    requisitar<Usuario>('/auth/cadastro', { method: 'POST', body: dados, autenticado: false }),

  login: (dados: LoginPayload) =>
    requisitar<LoginResponse>('/auth/login', { method: 'POST', body: dados, autenticado: false }),
}

// ---------------------------------------------------------------------------
// Macu
// ---------------------------------------------------------------------------

export const macuApi = {
  obterAvatar: () => requisitar<MacuAvatar>('/macu/avatar'),

  salvarAvatar: (avatar_config: MacuAvatar['avatar_config']) =>
    requisitar<MacuAvatar>('/macu/avatar', { method: 'PUT', body: { avatar_config } }),

  obterItas: () => requisitar<Itas>('/macu/itas'),
}

// ---------------------------------------------------------------------------
// Reko
// ---------------------------------------------------------------------------

export const rekoApi = {
  enviarCheckin: (payload: RekoCheckinPayload) =>
    requisitar<RekoCheckin>('/reko/checkin', { method: 'POST', body: payload }),

  agregadoDaOka: (okaId: number) => requisitar<RekoAggregate>(`/reko/aggregate/${okaId}`),
}

// ---------------------------------------------------------------------------
// Ayvu
// ---------------------------------------------------------------------------

export const ayvuApi = {
  listarTemas: () => requisitar<Tema[]>('/ayvu/temas'),

  detalheDoTema: (temaId: number) => requisitar<TemaDetalhe>(`/ayvu/temas/${temaId}`),

  obterProgresso: () => requisitar<ProgressoAluno>('/ayvu/progresso'),

  marcarProgresso: (conteudoId: number, concluido = true) =>
    requisitar<Progresso>('/ayvu/progresso', {
      method: 'POST',
      body: { conteudo_id: conteudoId, concluido },
    }),

  buscarVideos: (termo: string) =>
    requisitar<VideoSugerido[]>(`/ayvu/videos?termo=${encodeURIComponent(termo)}`),

  registrarPesquisa: (termo: string) =>
    requisitar<{ ok: boolean }>('/ayvu/pesquisas', { method: 'POST', body: { termo } }),
}

// ---------------------------------------------------------------------------
// Okas — a "ilha"/turma do professor
// ---------------------------------------------------------------------------

export const okaApi = {
  criar: (nome: string) => requisitar<Oka>('/okas', { method: 'POST', body: { nome } }),

  listarMinhas: () => requisitar<Oka[]>('/okas'),

  // Do aluno: a ilha que ele já entrou (null se nenhuma) — pra mostrar o
  // código de volta (ver LagoaCena.tsx).
  obterMinha: () => requisitar<Oka | null>('/okas/minha'),

  entrar: (codigo: string) =>
    requisitar<EntrarOkaResponse>('/okas/entrar', { method: 'POST', body: { codigo } }),

  listarAlunos: (okaId: number) => requisitar<AlunoDaOka[]>(`/okas/${okaId}/alunos`),
}

// Multiplayer na ilha — ver comentário em types/api.ts sobre ser polling.
export const presencaApi = {
  atualizar: (fx: number, fy: number) =>
    requisitar<void>('/okas/minha/presenca', { method: 'PUT', body: { fx, fy } }),

  listarDaMinhaIlha: () => requisitar<Presenca[]>('/okas/minha/presenca'),

  // Visão do professor: quem está na ilha dele agora, ao vivo.
  listarDaOka: (okaId: number) => requisitar<Presenca[]>(`/okas/${okaId}/presenca`),
}

// ---------------------------------------------------------------------------
// Oca pessoal — o espaço privado do aluno pra decorar
// ---------------------------------------------------------------------------

export const ocaPessoalApi = {
  obter: () => requisitar<OkaPessoal>('/oca'),

  salvar: (dados: OkaPessoal) =>
    requisitar<OkaPessoal>('/oca', {
      method: 'PUT',
      body: { cor_parede: dados.cor_parede, cor_chao: dados.cor_chao, item_central: dados.item_central },
    }),
}

// ---------------------------------------------------------------------------
// Chat em grupo da Oka
// ---------------------------------------------------------------------------

export const chatApi = {
  listarMinha: () => requisitar<MensagemChat[]>('/okas/minha/chat'),

  enviar: (texto: string) =>
    requisitar<MensagemChat>('/okas/minha/chat', { method: 'POST', body: { texto } }),

  // Visão do professor: só leitura, pra supervisão.
  listarDaOka: (okaId: number) => requisitar<MensagemChat[]>(`/okas/${okaId}/chat`),
}

// ---------------------------------------------------------------------------
// Notas — o boletim
// ---------------------------------------------------------------------------

export const notaApi = {
  lancar: (alunoId: number, payload: NotaPayload) =>
    requisitar<Nota>(`/notas/alunos/${alunoId}`, { method: 'POST', body: payload }),

  doAluno: (alunoId: number) => requisitar<Nota[]>(`/notas/alunos/${alunoId}`),

  minhas: () => requisitar<Nota[]>('/notas/minhas'),
}

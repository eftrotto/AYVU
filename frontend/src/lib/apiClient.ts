/**
 * Client HTTP único do AYVU — toda chamada ao backend passa por aqui.
 * Centraliza: header de autenticação, parse de erro padronizado (o backend
 * sempre responde erro como {"detail": ...}, string ou lista de validação),
 * e o tipo de retorno de cada chamada.
 */
import {
  type AlunoDaOka,
  type ColegaDaOka,
  type LoginPayload,
  type LoginResponse,
  type MacuAvatar,
  type CadastroPayload,
  type EntrarOkaResponse,
  type MensagemChat,
  type Nota,
  type NotaPayload,
  type Oka,
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
    resposta = await fetch(caminho, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
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

  entrar: (codigo: string) =>
    requisitar<EntrarOkaResponse>('/okas/entrar', { method: 'POST', body: { codigo } }),

  listarAlunos: (okaId: number) => requisitar<AlunoDaOka[]>(`/okas/${okaId}/alunos`),

  // Colegas da própria Oka (sem sinal de bem-estar nem temas: isso é só
  // pro professor, ver listarAlunos acima).
  listarColegas: () => requisitar<ColegaDaOka[]>('/okas/minha/colegas'),
}

// ---------------------------------------------------------------------------
// Chat em grupo da Oka
// ---------------------------------------------------------------------------

export const chatApi = {
  // Chat da própria Oka (aluno).
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

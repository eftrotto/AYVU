// Espelha manualmente os schemas Pydantic de backend/app/schemas.py.

export type TipoUsuario = 'aluno' | 'professor'

export interface Usuario {
  id: number
  nome: string
  tipo: TipoUsuario
  oka_id: number | null
}

export interface LoginResponse {
  token: string
  usuario: Usuario
}

export interface CadastroPayload {
  nome: string
  email: string
  senha: string
  tipo: TipoUsuario
  oka_id?: number | null
}

export interface LoginPayload {
  email: string
  senha: string
}

// ---------------------------------------------------------------------------
// Reko
// ---------------------------------------------------------------------------

export interface RekoCheckinPayload {
  data: string // YYYY-MM-DD
  autoconhecimento: number
  autogestao: number
  consciencia_social: number
  relacionamento: number
  decisao_responsavel: number
}

export interface RekoCheckin extends RekoCheckinPayload {
  id: number
  user_id: number
  criado_em: string
}

export interface RekoMedias {
  autoconhecimento: number
  autogestao: number
  consciencia_social: number
  relacionamento: number
  decisao_responsavel: number
}

export interface RekoAggregate {
  oka_id: number
  total_checkins: number
  dados_suficientes: boolean
  minimo_necessario: number
  medias: RekoMedias | null
}

// ---------------------------------------------------------------------------
// Macu
// ---------------------------------------------------------------------------

export interface MacuAvatarConfig {
  gender: 'male' | 'female'
  skinTone: string
  hairStyle: string
  hairColor: string
  eyebrowStyle: string
  eyeColor: string
  shirtColor: string
  pantsColor: string
  shoeColor: string
}

export interface MacuAvatar {
  user_id: number
  avatar_config: Partial<MacuAvatarConfig>
  atualizado_em: string
}

export interface Itas {
  itas_total: number
}

// Multiplayer (polling, não WebSocket — backend serverless no Vercel não
// mantém conexão aberta): posição de um colega (ou do professor, agora
// também presente) na mesma ilha agora.
export interface Presenca {
  user_id: number
  nome: string
  tipo: TipoUsuario
  fx: number
  fy: number
  avatar_config: Partial<MacuAvatarConfig>
}

// Oca pessoal do aluno (decoração do "seu espaço" — sem relação com a
// Oka/ilha do professor abaixo, além do nome).
export interface OkaPessoal {
  cor_parede: string
  cor_chao: string
  item_central: string
  atualizado_em: string
}

// ---------------------------------------------------------------------------
// Ayvu
// ---------------------------------------------------------------------------

export type TipoConteudo = 'video' | 'jogo' | 'leitura' | 'desafio'

export interface ContagemPorTipo {
  video: number
  jogo: number
  leitura: number
  desafio: number
}

export interface Tema {
  id: number
  nome: string
  descricao: string
  dentro_do_curriculo: boolean
  total_conteudos: number
  contagem_por_tipo: ContagemPorTipo
}

export interface Conteudo {
  id: number
  tema_id: number
  tipo: TipoConteudo
  titulo: string
  corpo_ou_url: string
  ordem_sugerida: number
}

export interface TemaDetalhe {
  id: number
  nome: string
  descricao: string
  dentro_do_curriculo: boolean
  conteudos_por_tipo: Partial<Record<TipoConteudo, Conteudo[]>>
}

export interface ProgressoItem {
  conteudo_id: number
  tema_id: number
  concluido: boolean
}

export interface Progresso {
  id: number
  user_id: number
  conteudo_id: number
  concluido: boolean
  data_ultima_interacao: string
}

export interface ProgressoAluno {
  user_id: number
  itens: ProgressoItem[]
}

export interface VideoSugerido {
  id: string
  titulo: string
  canal: string
  miniatura: string
}

export interface QuizConteudo {
  pergunta: string
  alternativas: string[]
  correta: number
  feedback_certo: string
  feedback_errado: string
}

// ---------------------------------------------------------------------------
// Okas — a "ilha"/turma do professor
// ---------------------------------------------------------------------------

export interface Oka {
  id: number
  nome: string
  codigo: string
  criado_em: string
}

export interface EntrarOkaResponse {
  oka_id: number
  nome_oka: string
}

export type SinalBemEstar = 'atencao' | 'neutro' | 'bem' | 'sem_dados'

export interface AlunoDaOka {
  id: number
  nome: string
  sinal_bem_estar: SinalBemEstar
  frase_bem_estar: string
  temas_pesquisados: string[]
}

export interface MensagemChat {
  id: number
  oka_id: number
  autor_id: number
  autor_nome: string
  texto: string
  criado_em: string
}

// ---------------------------------------------------------------------------
// Notas — o boletim
// ---------------------------------------------------------------------------

export interface NotaPayload {
  disciplina: string
  prova: string
  nota: number
  data: string // YYYY-MM-DD
}

export interface Nota extends NotaPayload {
  id: number
  aluno_id: number
}

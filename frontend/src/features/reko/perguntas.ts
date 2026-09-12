import type { RekoCheckinPayload } from '../../types/api'

export type ChaveCompetencia = Exclude<keyof RekoCheckinPayload, 'data'>

export interface Pergunta {
  chave: ChaveCompetencia
  texto: string
}

/** As 5 competências do CASEL 5 — não alterar o texto nem a ordem sem revisitar o framework. */
export const PERGUNTAS: Pergunta[] = [
  {
    chave: 'autoconhecimento',
    texto: 'Hoje eu consegui perceber bem o que estava sentindo.',
  },
  {
    chave: 'autogestao',
    texto: 'Hoje eu consegui lidar bem com o que me estressou ou desanimou.',
  },
  {
    chave: 'consciencia_social',
    texto: 'Hoje eu me senti capaz de entender como as pessoas ao meu redor estavam se sentindo.',
  },
  {
    chave: 'relacionamento',
    texto: 'Hoje eu me senti conectado(a) com as pessoas ao meu redor.',
  },
  {
    chave: 'decisao_responsavel',
    texto: 'Hoje eu fiz escolhas das quais me sinto bem.',
  },
]

export interface OpcaoLikert {
  valor: number
  emoji: string
  rotulo: string
}

export const OPCOES_LIKERT: OpcaoLikert[] = [
  { valor: 1, emoji: '😞', rotulo: 'Discordo totalmente' },
  { valor: 2, emoji: '🙁', rotulo: 'Discordo' },
  { valor: 3, emoji: '😐', rotulo: 'Neutro' },
  { valor: 4, emoji: '🙂', rotulo: 'Concordo' },
  { valor: 5, emoji: '😄', rotulo: 'Concordo totalmente' },
]

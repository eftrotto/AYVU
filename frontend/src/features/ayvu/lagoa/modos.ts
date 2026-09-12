export interface Modo {
  chave: string
  rotulo: string
  descricao: string
  emoji: string
}

/** Os 7 jeitos de estudar um tema — a ordem aqui é a ordem de exibição dos cards. */
export const MODOS: Modo[] = [
  { chave: 'entender', rotulo: 'Quero entender', descricao: 'Uma explicação clara, direto ao ponto.', emoji: '💡' },
  { chave: 'assistir', rotulo: 'Quero assistir', descricao: 'Vídeos e conteúdo visual sobre o tema.', emoji: '🎬' },
  { chave: 'praticar', rotulo: 'Quero praticar', descricao: 'Exercícios pra fixar o que você aprendeu.', emoji: '🎯' },
  { chave: 'conversar', rotulo: 'Quero conversar', descricao: 'Tire dúvidas conversando sobre o assunto.', emoji: '💬' },
  { chave: 'testar', rotulo: 'Quero testar', descricao: 'Um quiz rápido pra ver o que você já sabe.', emoji: '🧩' },
  { chave: 'explorar', rotulo: 'Quero explorar', descricao: 'Curiosidades e caminhos inesperados.', emoji: '🧭' },
  { chave: 'criar', rotulo: 'Quero criar', descricao: 'Coloque a mão na massa e produza algo.', emoji: '✏️' },
]

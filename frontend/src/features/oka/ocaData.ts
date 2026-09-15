// Catálogo de opções da Oca pessoal — protótipo simples (só decoração de
// ambiente), no mesmo espírito do catálogo do Macu em features/macu/lpcData.ts.

export const COR_TELHADO = '9c7b3f' // fixa — o telhado de palha não é customizável ainda

export const CORES_PAREDE = [
  { valor: 'c2a35f', hex: 'c2a35f', rotulo: 'Palha' },
  { valor: '8a6a4a', hex: '8a6a4a', rotulo: 'Barro' },
  { valor: 'a15c38', hex: 'a15c38', rotulo: 'Terracota' },
  { valor: '6b4423', hex: '6b4423', rotulo: 'Madeira escura' },
  { valor: 'd9c48f', hex: 'd9c48f', rotulo: 'Bambu' },
] as const

export const CORES_CHAO = [
  { valor: '7a5636', hex: '7a5636', rotulo: 'Terra' },
  { valor: '4a3c2c', hex: '4a3c2c', rotulo: 'Terra escura' },
  { valor: '9c8352', hex: '9c8352', rotulo: 'Areia' },
  { valor: '5c7a4a', hex: '5c7a4a', rotulo: 'Grama' },
] as const

export const ITENS_CENTRAIS = [
  { valor: 'nenhum', rotulo: 'Nenhum', emoji: null },
  { valor: 'fogueira', rotulo: 'Fogueira', emoji: '🔥' },
  { valor: 'cesto', rotulo: 'Cesto', emoji: '🧺' },
  { valor: 'banco', rotulo: 'Banco', emoji: '🪵' },
  { valor: 'planta', rotulo: 'Planta', emoji: '🪴' },
] as const

export type ItemCentral = (typeof ITENS_CENTRAIS)[number]['valor']

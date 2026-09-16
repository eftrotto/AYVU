// Posição do Macu dentro da Oka pessoal, salva como fração (0-1) da área
// navegável — mesmo esquema de ilhaStorage.ts (ver esse arquivo pro porquê
// de fração em vez de pixel, e pro plano de plugar isso no backend depois).

const PREFIXO_CHAVE = 'ayvu_macu_posicao_oka'

export interface PosicaoNaOka {
  fx: number // 0-1, fração da largura da elipse navegável
  fy: number // 0-1, fração da altura da elipse navegável
}

function chave(userId: number): string {
  return `${PREFIXO_CHAVE}_${userId}`
}

export function carregarPosicaoNaOka(userId: number): PosicaoNaOka | null {
  const bruto = localStorage.getItem(chave(userId))
  if (!bruto) return null
  try {
    const dados = JSON.parse(bruto)
    if (typeof dados.fx === 'number' && typeof dados.fy === 'number') return dados
    return null
  } catch {
    return null
  }
}

export function salvarPosicaoNaOka(userId: number, posicao: PosicaoNaOka): void {
  localStorage.setItem(chave(userId), JSON.stringify(posicao))
}

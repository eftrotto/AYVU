// Posição do Macu na ilha, salva como fração (0-1) da área navegável — não
// em pixels, pra continuar válida se a tela mudar de tamanho entre sessões.
// Chave isolada por user_id (mesmo motivo do rekoStorage: evita um aluno
// herdar a posição de outro no mesmo navegador).
//
// PLUGAR BACKEND AQUI DEPOIS: seguindo o padrão de macuApi.salvarAvatar
// (PUT /macu/avatar), daria pra adicionar um campo posicao_ilha no mesmo
// endpoint (ou um novo PUT /macu/posicao) e trocar as duas funções abaixo
// por chamadas à API — o resto do componente (MacuNaIlha) não precisaria mudar.

const PREFIXO_CHAVE = 'ayvu_macu_posicao_ilha'

export interface PosicaoNaIlha {
  fx: number // 0-1, fração da largura da área navegável
  fy: number // 0-1, fração da altura da área navegável
}

function chave(userId: number): string {
  return `${PREFIXO_CHAVE}_${userId}`
}

export function carregarPosicao(userId: number): PosicaoNaIlha | null {
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

export function salvarPosicao(userId: number, posicao: PosicaoNaIlha): void {
  localStorage.setItem(chave(userId), JSON.stringify(posicao))
}

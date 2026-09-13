/**
 * Fila genérica de "coisas que falharam ao enviar" — guardada no
 * localStorage pra não perder o dado se a rede cair. Usada pelo Reko
 * (check-in) e pelo Ayvu (progresso).
 *
 * TODO: ainda não existe uma rotina que sincronize essa fila de volta com o
 * backend quando a conexão voltar (ex.: reenviar tudo ao reabrir o app) —
 * por ora o dado fica salvo localmente, sem duplicar tentativas malsucedidas.
 */

export function salvarPendente<T>(chave: string, item: T): void {
  const lista = lerFila<T>(chave)
  lista.push(item)
  localStorage.setItem(chave, JSON.stringify(lista))
}

export function lerFila<T>(chave: string): T[] {
  const bruto = localStorage.getItem(chave)
  if (!bruto) return []
  try {
    return JSON.parse(bruto) as T[]
  } catch {
    return []
  }
}

// TODO: nada ainda sincroniza essa fila de volta com o backend quando a
// conexão voltar — por ora o dado só fica salvo localmente.

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

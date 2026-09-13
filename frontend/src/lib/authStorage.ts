import type { Usuario } from '../types/api'

const CHAVE_TOKEN = 'ayvu_auth_token'
const CHAVE_USUARIO = 'ayvu_auth_usuario'

export function obterToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN)
}

export function obterUsuarioSalvo(): Usuario | null {
  const bruto = localStorage.getItem(CHAVE_USUARIO)
  if (!bruto) return null
  try {
    return JSON.parse(bruto) as Usuario
  } catch {
    return null
  }
}

export function salvarSessao(token: string, usuario: Usuario): void {
  localStorage.setItem(CHAVE_TOKEN, token)
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario))
}

export function limparSessao(): void {
  localStorage.removeItem(CHAVE_TOKEN)
  localStorage.removeItem(CHAVE_USUARIO)
}

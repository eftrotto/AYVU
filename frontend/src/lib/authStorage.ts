import type { Usuario } from '../types/api'

const CHAVE_TOKEN = 'ayvu_auth_token'
const CHAVE_USUARIO = 'ayvu_auth_usuario'

// A sessão "de verdade" de cada aba vive no sessionStorage, que não é
// compartilhado entre abas. Com só localStorage (compartilhado), logar como
// professor numa aba trocava o token da aba do aluno, que continuava com
// cara de aluno mas mandava o token do professor pro servidor ("Só alunos
// podem acessar isso"). O localStorage fica só como cópia da última sessão,
// pra uma aba nova (ou o navegador reaberto) continuar logada.

function adotarUltimaSessaoSeAbaNova(): void {
  if (sessionStorage.getItem(CHAVE_TOKEN)) return
  const token = localStorage.getItem(CHAVE_TOKEN)
  const usuario = localStorage.getItem(CHAVE_USUARIO)
  if (!token || !usuario) return
  sessionStorage.setItem(CHAVE_TOKEN, token)
  sessionStorage.setItem(CHAVE_USUARIO, usuario)
}

export function obterToken(): string | null {
  adotarUltimaSessaoSeAbaNova()
  return sessionStorage.getItem(CHAVE_TOKEN)
}

export function obterUsuarioSalvo(): Usuario | null {
  adotarUltimaSessaoSeAbaNova()
  const bruto = sessionStorage.getItem(CHAVE_USUARIO)
  if (!bruto) return null
  try {
    return JSON.parse(bruto) as Usuario
  } catch {
    return null
  }
}

export function salvarSessao(token: string, usuario: Usuario): void {
  const usuarioJson = JSON.stringify(usuario)
  sessionStorage.setItem(CHAVE_TOKEN, token)
  sessionStorage.setItem(CHAVE_USUARIO, usuarioJson)
  localStorage.setItem(CHAVE_TOKEN, token)
  localStorage.setItem(CHAVE_USUARIO, usuarioJson)
}

export function limparSessao(): void {
  sessionStorage.removeItem(CHAVE_TOKEN)
  sessionStorage.removeItem(CHAVE_USUARIO)
  localStorage.removeItem(CHAVE_TOKEN)
  localStorage.removeItem(CHAVE_USUARIO)
}

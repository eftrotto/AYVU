import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../../lib/apiClient'
import { limparSessao, obterToken, obterUsuarioSalvo, salvarSessao } from '../../lib/authStorage'
import type { CadastroPayload, Usuario } from '../../types/api'

interface AuthContextValue {
  usuario: Usuario | null
  estaLogado: boolean
  fazerLogin: (email: string, senha: string) => Promise<Usuario>
  cadastrar: (dados: CadastroPayload) => Promise<Usuario>
  sair: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    // Sessão restaurada de forma síncrona no primeiro render — evita um
    // "pisca" de tela de login antes de descobrir que já existe sessão.
    return obterToken() ? obterUsuarioSalvo() : null
  })

  const fazerLogin = useCallback(async (email: string, senha: string) => {
    const resposta = await authApi.login({ email, senha })
    salvarSessao(resposta.token, resposta.usuario)
    setUsuario(resposta.usuario)
    return resposta.usuario
  }, [])

  const cadastrar = useCallback(async (dados: CadastroPayload) => {
    return authApi.cadastrar(dados)
  }, [])

  const sair = useCallback(() => {
    limparSessao()
    setUsuario(null)
  }, [])

  const valor = useMemo<AuthContextValue>(
    () => ({ usuario, estaLogado: usuario !== null, fazerLogin, cadastrar, sair }),
    [usuario, fazerLogin, cadastrar, sair],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  return contexto
}

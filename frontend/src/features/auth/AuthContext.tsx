import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../../lib/apiClient'
import { limparSessao, obterToken, obterUsuarioSalvo, salvarSessao } from '../../lib/authStorage'
import { precarregarAvatarPadrao } from '../macu/lpcData'
import type { CadastroPayload, Usuario } from '../../types/api'

interface AuthContextValue {
  usuario: Usuario | null
  estaLogado: boolean
  fazerLogin: (email: string, senha: string) => Promise<Usuario>
  cadastrar: (dados: CadastroPayload) => Promise<Usuario>
  sair: () => void
  // Atualiza o usuário em memória + localStorage sem precisar de um novo
  // login — usado depois de ações que mudam o próprio usuário no backend
  // mas não passam pelo fluxo de login (ex: entrar numa ilha muda o
  // oka_id; ver LagoaCena.tsx).
  atualizarUsuario: (usuario: Usuario) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    // Sessão restaurada de forma síncrona no primeiro render — evita um
    // "pisca" de tela de login antes de descobrir que já existe sessão.
    return obterToken() ? obterUsuarioSalvo() : null
  })

  useEffect(() => {
    if (usuario?.tipo === 'aluno') precarregarAvatarPadrao()
  }, [usuario])

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

  const atualizarUsuario = useCallback((novoUsuario: Usuario) => {
    const token = obterToken()
    if (!token) return
    salvarSessao(token, novoUsuario)
    setUsuario(novoUsuario)
  }, [])

  const valor = useMemo<AuthContextValue>(
    () => ({ usuario, estaLogado: usuario !== null, fazerLogin, cadastrar, sair, atualizarUsuario }),
    [usuario, fazerLogin, cadastrar, sair, atualizarUsuario],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  return contexto
}

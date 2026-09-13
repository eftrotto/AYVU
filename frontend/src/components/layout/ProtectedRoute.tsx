import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { jaFezCheckinHoje } from '../../features/reko/rekoStorage'
import type { TipoUsuario } from '../../types/api'

interface ProtectedRouteProps {
  children: ReactNode
  tipoEsperado?: TipoUsuario
  exigirRekoHoje?: boolean
}

/**
 * Bloqueia acesso sem sessão (ou com o tipo de conta errado) redirecionando
 * pro login. Com `exigirRekoHoje`, também bloqueia qualquer aluno (recém
 * cadastrado ou não) que ainda não fez o check-in de hoje — não importa se
 * ele chegou pela Lagoa, por um link direto pro Macu, ou qualquer outra
 * rota; sem o Reko de hoje, cai sempre em `/aluno/reko` primeiro.
 */
export function ProtectedRoute({ children, tipoEsperado, exigirRekoHoje }: ProtectedRouteProps) {
  const { usuario } = useAuth()

  if (!usuario) return <Navigate to="/login" replace />
  if (tipoEsperado && usuario.tipo !== tipoEsperado) {
    // logado com o tipo errado: manda pra própria área dele, não pro login.
    return <Navigate to={usuario.tipo === 'professor' ? '/professor' : '/aluno'} replace />
  }
  if (exigirRekoHoje && usuario.tipo === 'aluno' && !jaFezCheckinHoje(usuario.id)) {
    return <Navigate to="/aluno/reko" replace />
  }

  return <>{children}</>
}

import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import type { TipoUsuario } from '../../types/api'

interface ProtectedRouteProps {
  children: ReactNode
  tipoEsperado?: TipoUsuario
}

/** Bloqueia acesso sem sessão (ou com o tipo de conta errado) redirecionando pro login. */
export function ProtectedRoute({ children, tipoEsperado }: ProtectedRouteProps) {
  const { usuario } = useAuth()

  if (!usuario) return <Navigate to="/login" replace />
  if (tipoEsperado && usuario.tipo !== tipoEsperado) {
    // logado com o tipo errado: manda pra própria área dele, não pro login.
    return <Navigate to={usuario.tipo === 'professor' ? '/professor' : '/aluno'} replace />
  }

  return <>{children}</>
}

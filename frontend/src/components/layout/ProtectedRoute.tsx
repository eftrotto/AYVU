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

/** Com `exigirRekoHoje`, qualquer rota sem o check-in de hoje cai em `/aluno/reko` primeiro. */
export function ProtectedRoute({ children, tipoEsperado, exigirRekoHoje }: ProtectedRouteProps) {
  const { usuario } = useAuth()

  if (!usuario) return <Navigate to="/login" replace />
  if (tipoEsperado && usuario.tipo !== tipoEsperado) {
    return <Navigate to={usuario.tipo === 'professor' ? '/professor' : '/aluno'} replace />
  }
  if (exigirRekoHoje && usuario.tipo === 'aluno' && !jaFezCheckinHoje(usuario.id)) {
    return <Navigate to="/aluno/reko" replace />
  }

  return <>{children}</>
}

import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { jaFezCheckinHoje } from '../reko/rekoStorage'

/** O check-in do Reko vem sempre antes da Lagoa. */
export function AlunoEntrada() {
  const { usuario } = useAuth()
  const feito = usuario ? jaFezCheckinHoje(usuario.id) : false
  return <Navigate to={feito ? '/aluno/ayvu' : '/aluno/reko'} replace />
}

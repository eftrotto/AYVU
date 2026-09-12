import { Navigate } from 'react-router-dom'
import { jaFezCheckinHoje } from '../reko/rekoStorage'

/**
 * Ponto de entrada do aluno (`/aluno`). Não é mais uma tela com 3 cards —
 * o Ayvu (Lagoa) virou a "casa" do aluno, mas só depois do Reko de hoje
 * estar feito: o check-in emocional vem sempre primeiro.
 */
export function AlunoEntrada() {
  return <Navigate to={jaFezCheckinHoje() ? '/aluno/ayvu' : '/aluno/reko'} replace />
}

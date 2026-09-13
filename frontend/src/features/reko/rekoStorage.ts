/**
 * Controle de "já fez o check-in hoje" — usado pelo RekoPage (pra travar
 * um segundo check-in no mesmo dia) e pelo gate de entrada do aluno
 * (features/dashboard/AlunoEntrada.tsx), que só libera a Lagoa do Ayvu
 * depois do Reko de hoje estar feito.
 *
 * A chave é isolada por user_id: sem isso, dois alunos logando no mesmo
 * navegador (comum em laboratório de escola, ou mesmo em teste manual)
 * fariam o segundo aluno herdar o "já fiz o check-in hoje" do primeiro.
 */

const PREFIXO_CHAVE = 'ayvu_reko_ultimo_checkin'

function chave(userId: number): string {
  return `${PREFIXO_CHAVE}_${userId}`
}

export function dataDeHoje(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function jaFezCheckinHoje(userId: number): boolean {
  return localStorage.getItem(chave(userId)) === dataDeHoje()
}

export function marcarCheckinDeHoje(userId: number): void {
  localStorage.setItem(chave(userId), dataDeHoje())
}

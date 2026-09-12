/**
 * Controle de "já fez o check-in hoje" — usado pelo RekoPage (pra travar
 * um segundo check-in no mesmo dia) e pelo gate de entrada do aluno
 * (features/dashboard/AlunoEntrada.tsx), que só libera a Lagoa do Ayvu
 * depois do Reko de hoje estar feito.
 */

const CHAVE_ULTIMO_CHECKIN = 'ayvu_reko_ultimo_checkin'

export function dataDeHoje(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function jaFezCheckinHoje(): boolean {
  return localStorage.getItem(CHAVE_ULTIMO_CHECKIN) === dataDeHoje()
}

export function marcarCheckinDeHoje(): void {
  localStorage.setItem(CHAVE_ULTIMO_CHECKIN, dataDeHoje())
}

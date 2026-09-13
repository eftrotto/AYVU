// Chave isolada por user_id: sem isso, um segundo aluno logando no mesmo
// navegador herdaria o "já fiz o check-in hoje" do primeiro.
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

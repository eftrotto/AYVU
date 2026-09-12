import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { rekoApi } from '../../lib/apiClient'
import { salvarPendente } from '../../lib/filaPendente'
import type { RekoCheckinPayload } from '../../types/api'
import { OPCOES_LIKERT, PERGUNTAS, type ChaveCompetencia } from './perguntas'

const CHAVE_ULTIMO_CHECKIN = 'ayvu_reko_ultimo_checkin'
const CHAVE_PENDENTES = 'ayvu_reko_pendentes'

function dataDeHoje(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function jaFezCheckinHoje(): boolean {
  return localStorage.getItem(CHAVE_ULTIMO_CHECKIN) === dataDeHoje()
}

function marcarCheckinDeHoje(): void {
  localStorage.setItem(CHAVE_ULTIMO_CHECKIN, dataDeHoje())
}

type Respostas = Partial<Record<ChaveCompetencia, number>>

export function RekoPage() {
  const navigate = useNavigate()
  const [jaFeito] = useState(jaFezCheckinHoje)
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState<Respostas>({})
  const [concluido, setConcluido] = useState(false)
  const [avancoPendente, setAvancoPendente] = useState(false)

  const mutacao = useMutation({
    mutationFn: (payload: RekoCheckinPayload) => rekoApi.enviarCheckin(payload),
  })

  async function enviar(respostasFinais: Respostas) {
    const payload: RekoCheckinPayload = {
      data: dataDeHoje(),
      autoconhecimento: respostasFinais.autoconhecimento!,
      autogestao: respostasFinais.autogestao!,
      consciencia_social: respostasFinais.consciencia_social!,
      relacionamento: respostasFinais.relacionamento!,
      decisao_responsavel: respostasFinais.decisao_responsavel!,
    }

    try {
      await mutacao.mutateAsync(payload)
    } catch (erro) {
      // já existe check-in hoje no servidor (409) tem o mesmo resultado
      // pro aluno; qualquer outra falha (rede, 500...) guarda localmente.
      const status = (erro as { status?: number }).status
      if (status !== 409) {
        salvarPendente(CHAVE_PENDENTES, payload)
      }
    }

    marcarCheckinDeHoje()
    setConcluido(true)
  }

  function selecionar(chave: ChaveCompetencia, valor: number) {
    if (avancoPendente) return
    const novasRespostas = { ...respostas, [chave]: valor }
    setRespostas(novasRespostas)
    setAvancoPendente(true)

    setTimeout(() => {
      setAvancoPendente(false)
      if (indice < PERGUNTAS.length - 1) {
        setIndice((i) => i + 1)
      } else {
        void enviar(novasRespostas)
      }
    }, 350)
  }

  if (jaFeito && !concluido) {
    return (
      <AppShell largura="sm" voltar={{ rotulo: 'Início', aoClicar: () => navigate('/aluno') }}>
        <TelaCentro emoji="✅" titulo="Você já fez o check-in de hoje" texto="Volte amanhã pra contar como você está." />
      </AppShell>
    )
  }

  if (concluido) {
    return (
      <AppShell largura="sm" voltar={{ rotulo: 'Início', aoClicar: () => navigate('/aluno') }}>
        <TelaCentro emoji="🌱" titulo="Prontinho!" texto="Obrigado por compartilhar como você está hoje." />
      </AppShell>
    )
  }

  const pergunta = PERGUNTAS[indice]

  return (
    <AppShell largura="sm" voltar={{ rotulo: 'Início', aoClicar: () => navigate('/aluno') }}>
      <div className="rounded-3xl border border-border bg-card p-7 shadow-warm">
        <div className="mb-7 flex items-center gap-3">
          <ProgressBar percentual={(indice / PERGUNTAS.length) * 100} />
          <span className="whitespace-nowrap text-xs font-bold text-text-soft">
            Pergunta {indice + 1} de {PERGUNTAS.length}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={pergunta.chave}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            <p className="mb-6 text-lg font-semibold text-text">{pergunta.texto}</p>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              {OPCOES_LIKERT.map((opcao) => {
                const selecionada = respostas[pergunta.chave] === opcao.valor
                return (
                  <button
                    key={opcao.valor}
                    type="button"
                    onClick={() => selecionar(pergunta.chave, opcao.valor)}
                    className={`flex flex-1 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors sm:flex-col sm:items-center sm:gap-1.5 sm:text-center ${
                      selecionada
                        ? 'border-accent bg-accent-soft'
                        : 'border-border bg-[#fffaf3] hover:border-accent'
                    }`}
                  >
                    <span className="text-2xl" aria-hidden>
                      {opcao.emoji}
                    </span>
                    <span className="text-sm font-semibold text-text sm:text-xs">{opcao.rotulo}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {indice > 0 && (
          <button
            type="button"
            onClick={() => setIndice((i) => i - 1)}
            className="mt-6 text-sm font-bold text-text-soft hover:text-secondary"
          >
            ‹ Voltar
          </button>
        )}
      </div>
    </AppShell>
  )
}

function TelaCentro({ emoji, titulo, texto }: { emoji: string; titulo: string; texto: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-warm">
      <span className="text-4xl">{emoji}</span>
      <h2 className="text-lg font-bold text-text">{titulo}</h2>
      <p className="max-w-[32ch] text-sm text-text-soft">{texto}</p>
    </div>
  )
}

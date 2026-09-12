import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { rekoApi } from '../../lib/apiClient'
import { salvarPendente } from '../../lib/filaPendente'
import type { RekoCheckinPayload } from '../../types/api'
import { OPCOES_LIKERT, PERGUNTAS, type ChaveCompetencia } from './perguntas'
import { dataDeHoje, jaFezCheckinHoje, marcarCheckinDeHoje } from './rekoStorage'

const CHAVE_PENDENTES = 'ayvu_reko_pendentes'

type Respostas = Partial<Record<ChaveCompetencia, number>>

export function RekoPage() {
  const navigate = useNavigate()
  const [jaFeito] = useState(jaFezCheckinHoje)
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState<Respostas>({})
  const [concluido, setConcluido] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const pergunta = PERGUNTAS[indice]
  const ultimaPergunta = indice === PERGUNTAS.length - 1

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
    if (enviando) return
    setRespostas((r) => ({ ...r, [chave]: valor }))
  }

  function confirmar() {
    if (enviando || respostas[pergunta.chave] === undefined) return

    if (!ultimaPergunta) {
      setIndice((i) => i + 1)
      return
    }

    setEnviando(true)
    void enviar(respostas)
  }

  if (jaFeito && !concluido) {
    return (
      <TelaCentro emoji="✅" titulo="Você já fez o check-in de hoje" texto="Volte amanhã pra contar como você está.">
        <Button onClick={() => navigate('/aluno/ayvu')}>Ir para o Ayvu</Button>
      </TelaCentro>
    )
  }

  if (concluido) {
    return (
      <TelaCentro emoji="🌱" titulo="Prontinho!" texto="Obrigado por compartilhar como você está hoje.">
        <Button onClick={() => navigate('/aluno/ayvu')}>Ir para o Ayvu</Button>
      </TelaCentro>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <img src="/assets/logo.png" alt="AYVU" className="mx-auto mb-6 h-8 w-auto" />

      <div className="rounded-3xl border border-border bg-card p-7 shadow-warm">
        <div className="mb-7 flex items-center gap-3">
          <ProgressBar percentual={(indice / PERGUNTAS.length) * 100} />
          <span className="whitespace-nowrap text-xs font-bold text-text-soft">
            Pergunta {indice + 1} de {PERGUNTAS.length}
          </span>
        </div>

        <motion.div
          key={pergunta.chave}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
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

        <Button
          onClick={confirmar}
          disabled={respostas[pergunta.chave] === undefined || enviando}
          className="mt-6 w-full"
        >
          {enviando ? 'Enviando...' : ultimaPergunta ? 'Concluir' : 'Confirmar resposta'}
        </Button>

        {indice > 0 && (
          <button
            type="button"
            onClick={() => setIndice((i) => i - 1)}
            disabled={enviando}
            className="mt-4 text-sm font-bold text-text-soft hover:text-secondary disabled:opacity-40"
          >
            ‹ Voltar
          </button>
        )}
      </div>
    </div>
  )
}

function TelaCentro({
  emoji,
  titulo,
  texto,
  children,
}: {
  emoji: string
  titulo: string
  texto: string
  children?: React.ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <img src="/assets/logo.png" alt="AYVU" className="mx-auto mb-6 h-8 w-auto" />
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-warm">
        <span className="text-4xl">{emoji}</span>
        <h2 className="text-lg font-bold text-text">{titulo}</h2>
        <p className="max-w-[32ch] text-sm text-text-soft">{texto}</p>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  )
}

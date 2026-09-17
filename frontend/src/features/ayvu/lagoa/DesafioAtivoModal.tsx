import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { desafioApi } from '../../../lib/apiClient'
import { DesenhoCanvas, type DesenhoCanvasHandle } from '../../desenho/DesenhoCanvas'

interface DesafioAtivoModalProps {
  okaId: number
}

const INTERVALO_POLLING_MS = 5000

function formatarTempo(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Aparece por cima da LagoaCena quando o professor ativa um Desafio de
 * Desenho na ilha (ver IlhaAoVivo.tsx, o quadro no cavalete). O cronômetro
 * é ressincronizado a cada poll com `tempo_restante_segundos` calculado no
 * backend (models.DesafioDesenho.criado_em + duracao_segundos) — o
 * setInterval local só deixa a contagem fluida entre um poll e outro, nunca
 * é a fonte de verdade.
 */
export function DesafioAtivoModal({ okaId }: DesafioAtivoModalProps) {
  const queryClient = useQueryClient()
  const canvasRef = useRef<DesenhoCanvasHandle>(null)
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null)
  // Id do último desafio já resolvido (enviado ou fechado) nessa sessão —
  // sem isso o modal reabriria sozinho a cada poll seguinte pro mesmo desafio.
  const [desafioResolvidoId, setDesafioResolvidoId] = useState<number | null>(null)

  const { data: desafio } = useQuery({
    queryKey: ['desafios', 'ativo', okaId],
    queryFn: () => desafioApi.ativoDaOka(okaId),
    refetchInterval: INTERVALO_POLLING_MS,
    enabled: okaId != null,
  })

  const enviar = useMutation({
    mutationFn: (desafioId: number) => desafioApi.enviarDesenho(desafioId, canvasRef.current?.exportarPng() ?? ''),
    onSettled: (_dados, _erro, desafioId) => {
      setDesafioResolvidoId(desafioId)
      void queryClient.invalidateQueries({ queryKey: ['desafios', 'ativo', okaId] })
    },
  })

  const mostrar =
    desafio != null && !desafio.ja_enviei && desafio.id !== desafioResolvidoId && (segundosRestantes ?? 0) > 0

  // Ressincroniza com o servidor a cada poll — corrige qualquer desvio do
  // timer local em vez de confiar só nele.
  useEffect(() => {
    if (desafio) setSegundosRestantes(desafio.tempo_restante_segundos)
  }, [desafio?.id, desafio?.tempo_restante_segundos])

  useEffect(() => {
    if (!mostrar) return undefined
    const id = window.setInterval(() => {
      setSegundosRestantes((atual) => (atual === null ? null : Math.max(0, atual - 1)))
    }, 1000)
    return () => window.clearInterval(id)
  }, [mostrar])

  // Tempo local zerou: envia automaticamente (o backend também recusa um
  // envio fora do prazo, então mesmo com pequena diferença de relógio o
  // pior caso é só não enviar — nunca envia "tarde demais" sem avisar).
  useEffect(() => {
    if (desafio && !desafio.ja_enviei && segundosRestantes === 0 && desafio.id !== desafioResolvidoId && !enviar.isPending) {
      enviar.mutate(desafio.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segundosRestantes, desafio?.id])

  if (!desafio) return null

  return (
    <AnimatePresence>
      {mostrar && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="w-full max-w-lg rounded-3xl border border-border bg-card p-5 shadow-warm"
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-secondary">🎨 Desafio de Desenho</p>
                <h2 className="text-xl font-bold text-text">{desafio.tema}</h2>
              </div>
              <span
                className={`flex-none rounded-full px-3 py-1.5 text-sm font-bold tabular-nums ${
                  (segundosRestantes ?? 0) <= 10 ? 'bg-erro-soft text-erro' : 'bg-accent-soft text-accent'
                }`}
              >
                ⏱ {formatarTempo(segundosRestantes ?? desafio.tempo_restante_segundos)}
              </span>
            </div>

            <DesenhoCanvas ref={canvasRef} bloqueado={enviar.isPending} />

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-text-soft">
                {enviar.isPending ? 'Enviando...' : 'Envia sozinho quando o tempo acabar.'}
              </p>
              <button
                type="button"
                onClick={() => enviar.mutate(desafio.id)}
                disabled={enviar.isPending}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-60"
              >
                {enviar.isPending ? 'Enviando...' : 'Enviar agora'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { motion, useAnimationFrame, useMotionValue } from 'framer-motion'
import type { MacuAvatarConfig } from '../../types/api'
import { AvatarStage } from '../macu/AvatarStage'
import {
  LPC_FRAME_ROW,
  LPC_FRAME_ROW_CIMA,
  LPC_FRAME_ROW_DIREITA,
  LPC_FRAME_ROW_ESQUERDA,
  LPC_QUADROS_CAMINHADA,
} from '../macu/lpcData'
import { carregarPosicaoNaOka, salvarPosicaoNaOka } from './okaStorage'

export interface MacuNaOkaHandle {
  moverPara: (clienteX: number, clienteY: number) => void
}

interface MacuNaOkaProps {
  config: MacuAvatarConfig
  cenaRef: React.RefObject<HTMLDivElement | null>
  chaoRef: React.RefObject<HTMLDivElement | null>
  userId: number | null
  tamanho?: number
}

const VELOCIDADE_PX_POR_S = 260
const RAIO_MACU = 17
const DISTANCIA_CHEGADA = 1.5
const FPS_CAMINHADA = 9
const INTERVALO_QUADRO_MS = 1000 / FPS_CAMINHADA

interface Limites {
  cx: number
  cy: number
  rx: number
  ry: number
}

interface Marcador {
  id: number
  x: number
  y: number
}

/**
 * Macu dentro da Oka — mesma técnica de MacuNaIlha.tsx (clique num ponto e
 * ele caminha até lá, restrito a uma elipse medida via chaoRef), só que sem
 * zona de exclusão de árvore: aqui o único limite é o chão interno da Oka
 * (a parede/porta ficam de fora da elipse, então ele nunca atravessa).
 */
export const MacuNaOka = forwardRef<MacuNaOkaHandle, MacuNaOkaProps>(function MacuNaOka(
  { config, cenaRef, chaoRef, userId, tamanho = 132 },
  refExterno,
) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const limitesRef = useRef<Limites>({ cx: 0, cy: 0, rx: 0, ry: 0 })
  const posicaoPadraoRef = useRef({ x: 0, y: 0 })
  const prontoRef = useRef(false)
  const alvoRef = useRef<{ x: number; y: number } | null>(null)
  const ultimoSalvamento = useRef(0)
  const ultimoTempoRef = useRef<number | null>(null)
  const [marcador, setMarcador] = useState<Marcador | null>(null)
  const [quadro, setQuadro] = useState({ linha: LPC_FRAME_ROW, coluna: 0 })
  const quadroCaminhadaRef = useRef(0)
  const ultimoQuadroTempoRef = useRef(0)

  const restringir = useCallback((novoX: number, novoY: number) => {
    const { cx, cy, rx, ry } = limitesRef.current
    if (rx <= 0 || ry <= 0) return { x: novoX, y: novoY }

    const dx = novoX - cx
    const dy = novoY - cy
    const distElipse = Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
    if (distElipse > 1) {
      return { x: cx + dx / distElipse, y: cy + dy / distElipse }
    }
    return { x: novoX, y: novoY }
  }, [])

  const persistir = useCallback(() => {
    if (userId == null) return
    const agora = performance.now()
    if (agora - ultimoSalvamento.current < 400) return
    ultimoSalvamento.current = agora

    const { cx, cy, rx, ry } = limitesRef.current
    if (rx <= 0 || ry <= 0) return
    const fx = Math.min(1, Math.max(0, (x.get() - (cx - rx)) / (rx * 2)))
    const fy = Math.min(1, Math.max(0, (y.get() - (cy - ry)) / (ry * 2)))
    salvarPosicaoNaOka(userId, { fx, fy })
  }, [userId, x, y])

  const medirLimites = useCallback(() => {
    const cena = cenaRef.current
    const chao = chaoRef.current
    if (!cena || !chao) return

    const cenaRect = cena.getBoundingClientRect()
    const chaoRect = chao.getBoundingClientRect()
    if (chaoRect.width < 20 || chaoRect.height < 20) return

    const cx = chaoRect.left - cenaRect.left + chaoRect.width / 2
    const cy = chaoRect.top - cenaRect.top + chaoRect.height / 2
    const rx = Math.max(chaoRect.width / 2 - RAIO_MACU, 10)
    const ry = Math.max(chaoRect.height / 2 - RAIO_MACU, 10)

    const limitesAnteriores = limitesRef.current
    limitesRef.current = { cx, cy, rx, ry }
    // Posição padrão: centro exato da elipse navegável, bem apoiado no
    // chão interno (nem perto da parede, nem sobre a porta).
    posicaoPadraoRef.current = { x: cx, y: cy }

    if (!prontoRef.current) {
      prontoRef.current = true
      const salva = userId != null ? carregarPosicaoNaOka(userId) : null
      if (salva) {
        x.set(cx - rx + salva.fx * (rx * 2))
        y.set(cy - ry + salva.fy * (ry * 2))
      } else {
        x.set(posicaoPadraoRef.current.x)
        y.set(posicaoPadraoRef.current.y)
      }
    } else if (limitesAnteriores.rx > 0 && limitesAnteriores.ry > 0) {
      const fx = (x.get() - (limitesAnteriores.cx - limitesAnteriores.rx)) / (limitesAnteriores.rx * 2)
      const fy = (y.get() - (limitesAnteriores.cy - limitesAnteriores.ry)) / (limitesAnteriores.ry * 2)
      x.set(cx - rx + fx * (rx * 2))
      y.set(cy - ry + fy * (ry * 2))
    }
  }, [cenaRef, chaoRef, userId, x, y])

  useEffect(() => {
    medirLimites()
    const cena = cenaRef.current
    if (!cena || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', medirLimites)
      return () => window.removeEventListener('resize', medirLimites)
    }
    const observer = new ResizeObserver(() => medirLimites())
    observer.observe(cena)
    return () => observer.disconnect()
  }, [medirLimites, cenaRef])

  useAnimationFrame((tempoDesdeInicio) => {
    const alvo = alvoRef.current
    if (!alvo) {
      ultimoTempoRef.current = tempoDesdeInicio
      return
    }

    const anterior = ultimoTempoRef.current
    ultimoTempoRef.current = tempoDesdeInicio
    if (anterior === null) return
    const deltaReal = Math.min(tempoDesdeInicio - anterior, 100)
    if (deltaReal <= 0) return

    const dx = alvo.x - x.get()
    const dy = alvo.y - y.get()
    const dist = Math.sqrt(dx * dx + dy * dy)
    const passo = (VELOCIDADE_PX_POR_S * deltaReal) / 1000

    if (dist <= Math.max(passo, DISTANCIA_CHEGADA)) {
      x.set(alvo.x)
      y.set(alvo.y)
      alvoRef.current = null
      setQuadro((q) => (q.coluna === 0 ? q : { ...q, coluna: 0 }))
    } else {
      const antesX = x.get()
      const antesY = y.get()
      const proximo = restringir(antesX + (dx / dist) * passo, antesY + (dy / dist) * passo)
      if (Math.hypot(proximo.x - antesX, proximo.y - antesY) < 0.05) {
        alvoRef.current = null
        setQuadro((q) => (q.coluna === 0 ? q : { ...q, coluna: 0 }))
      } else {
        x.set(proximo.x)
        y.set(proximo.y)

        const linhaAtual =
          Math.abs(dx) > Math.abs(dy)
            ? dx > 0
              ? LPC_FRAME_ROW_DIREITA
              : LPC_FRAME_ROW_ESQUERDA
            : dy > 0
              ? LPC_FRAME_ROW
              : LPC_FRAME_ROW_CIMA

        if (tempoDesdeInicio - ultimoQuadroTempoRef.current >= INTERVALO_QUADRO_MS) {
          ultimoQuadroTempoRef.current = tempoDesdeInicio
          quadroCaminhadaRef.current = (quadroCaminhadaRef.current + 1) % LPC_QUADROS_CAMINHADA
          setQuadro({ linha: linhaAtual, coluna: quadroCaminhadaRef.current })
        } else if (quadro.linha !== linhaAtual) {
          setQuadro((q) => ({ ...q, linha: linhaAtual }))
        }
      }
    }
    persistir()
  })

  useImperativeHandle(refExterno, () => ({
    moverPara(clienteX, clienteY) {
      const cena = cenaRef.current
      if (!cena) return
      const rect = cena.getBoundingClientRect()
      const alvo = restringir(clienteX - rect.left, clienteY - rect.top)
      alvoRef.current = alvo
      setMarcador({ id: Date.now(), x: alvo.x, y: alvo.y })
    },
  }))

  return (
    <>
      {marcador && (
        <motion.div
          key={marcador.id}
          className="absolute z-[4] rounded-full border-2 border-white/80"
          style={{ left: marcador.x, top: marcador.y, translateX: '-50%', translateY: '-50%' }}
          initial={{ width: 6, height: 6, opacity: 0.9 }}
          animate={{ width: 34, height: 34, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          onAnimationComplete={() => setMarcador((atual) => (atual?.id === marcador.id ? null : atual))}
        />
      )}
      <motion.div className="absolute z-[5]" style={{ left: x, top: y }}>
        <div style={{ transform: 'translate(-50%, -82%)' }}>
          <AvatarStage config={config} tamanho={tamanho} comMoldura={false} linha={quadro.linha} coluna={quadro.coluna} />
        </div>
      </motion.div>
    </>
  )
})

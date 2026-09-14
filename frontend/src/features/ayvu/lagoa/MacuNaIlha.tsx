import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { motion, useAnimationFrame, useMotionValue, type TargetAndTransition, type Transition } from 'framer-motion'
import type { MacuAvatarConfig } from '../../../types/api'
import { AvatarStage } from '../../macu/AvatarStage'
import {
  LPC_FRAME_ROW,
  LPC_FRAME_ROW_CIMA,
  LPC_FRAME_ROW_DIREITA,
  LPC_FRAME_ROW_ESQUERDA,
  LPC_QUADROS_CAMINHADA,
} from '../../macu/lpcData'
import { carregarPosicao, salvarPosicao } from './ilhaStorage'

export interface MacuNaIlhaHandle {
  resetarParaPadrao: () => void
  moverPara: (clienteX: number, clienteY: number) => void
}

interface MacuNaIlhaProps {
  config: MacuAvatarConfig
  ilhaRef: React.RefObject<HTMLDivElement | null>
  gramaRef: React.RefObject<HTMLDivElement | null>
  arvoreRef: React.RefObject<HTMLDivElement | null>
  ativo: boolean
  userId: number | null
  animarPulo?: TargetAndTransition
  transicaoPulo?: Transition
  tamanho?: number
}

const VELOCIDADE_PX_POR_S = 260
const RAIO_MACU = 30
const RAIO_EXCLUSAO_ARVORE = 60
const DISTANCIA_CHEGADA = 1.5
const FPS_CAMINHADA = 9
const INTERVALO_QUADRO_MS = 1000 / FPS_CAMINHADA

interface Limites {
  cx: number
  cy: number
  rx: number
  ry: number
  arvoreCx: number
  arvoreCy: number
}

interface Marcador {
  id: number
  x: number
  y: number
}

/**
 * Macu na ilha — clique/toque num ponto da ilha e ele caminha até lá (estilo
 * "point and click"), restrito a uma elipse (a grama, medida via gramaRef)
 * com uma zona de exclusão circular ao redor do coqueiro (arvoreRef). A
 * posição é guardada como fração 0-1 da elipse (ver ilhaStorage.ts), então
 * continua válida se a tela for redimensionada entre sessões.
 */
export const MacuNaIlha = forwardRef<MacuNaIlhaHandle, MacuNaIlhaProps>(function MacuNaIlha(
  { config, ilhaRef, gramaRef, arvoreRef, ativo, userId, animarPulo, transicaoPulo, tamanho = 132 },
  refExterno,
) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const limitesRef = useRef<Limites>({ cx: 0, cy: 0, rx: 0, ry: 0, arvoreCx: -9999, arvoreCy: -9999 })
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
    const { cx, cy, rx, ry, arvoreCx, arvoreCy } = limitesRef.current
    if (rx <= 0 || ry <= 0) return { x: novoX, y: novoY }

    const dx = novoX - cx
    const dy = novoY - cy
    const distElipse = Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
    let px = novoX
    let py = novoY
    if (distElipse > 1) {
      px = cx + dx / distElipse
      py = cy + dy / distElipse
    }

    const ddx = px - arvoreCx
    const ddy = py - arvoreCy
    const distArvore = Math.sqrt(ddx * ddx + ddy * ddy)
    if (distArvore < RAIO_EXCLUSAO_ARVORE && distArvore > 0.001) {
      const fator = RAIO_EXCLUSAO_ARVORE / distArvore
      px = arvoreCx + ddx * fator
      py = arvoreCy + ddy * fator
    }

    return { x: px, y: py }
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
    salvarPosicao(userId, { fx, fy })
  }, [userId, x, y])

  const medirLimites = useCallback(() => {
    const ilha = ilhaRef.current
    const grama = gramaRef.current
    if (!ilha || !grama) return

    const ilhaRect = ilha.getBoundingClientRect()
    const gramaRect = grama.getBoundingClientRect()
    // Layout ainda não assentou (ex: primeiro paint, troca de viewport em
    // andamento) — espera a próxima medição em vez de travar numa posição
    // calculada com um tamanho que já não é o real.
    if (gramaRect.width < 20 || gramaRect.height < 20) return

    const cx = gramaRect.left - ilhaRect.left + gramaRect.width / 2
    const cy = gramaRect.top - ilhaRect.top + gramaRect.height / 2
    const rx = Math.max(gramaRect.width / 2 - RAIO_MACU, 10)
    const ry = Math.max(gramaRect.height / 2 - RAIO_MACU, 10)

    let arvoreCx = -9999
    let arvoreCy = -9999
    const arvore = arvoreRef.current
    if (arvore) {
      const arvoreRect = arvore.getBoundingClientRect()
      arvoreCx = arvoreRect.left - ilhaRect.left + arvoreRect.width * 0.35
      arvoreCy = arvoreRect.top - ilhaRect.top + arvoreRect.height * 0.6
    }

    const limitesAnteriores = limitesRef.current
    limitesRef.current = { cx, cy, rx, ry, arvoreCx, arvoreCy }
    posicaoPadraoRef.current = { x: cx + rx * 0.68, y: cy }

    if (!prontoRef.current) {
      prontoRef.current = true
      const salva = userId != null ? carregarPosicao(userId) : null
      if (salva) {
        x.set(cx - rx + salva.fx * (rx * 2))
        y.set(cy - ry + salva.fy * (ry * 2))
      } else {
        x.set(posicaoPadraoRef.current.x)
        y.set(posicaoPadraoRef.current.y)
      }
    } else if (limitesAnteriores.rx > 0 && limitesAnteriores.ry > 0) {
      // A tela mudou de tamanho (ex: rotação, resize): reaplica a MESMA
      // fração relativa que o Macu já estava, pros novos limites — sem
      // isso ele ficaria "para trás", numa posição em px que não existe
      // mais na ilha (re)dimensionada.
      const fx = (x.get() - (limitesAnteriores.cx - limitesAnteriores.rx)) / (limitesAnteriores.rx * 2)
      const fy = (y.get() - (limitesAnteriores.cy - limitesAnteriores.ry)) / (limitesAnteriores.ry * 2)
      x.set(cx - rx + fx * (rx * 2))
      y.set(cy - ry + fy * (ry * 2))
    }
  }, [ilhaRef, gramaRef, arvoreRef, userId, x, y])

  useEffect(() => {
    medirLimites()
    const ilha = ilhaRef.current
    if (!ilha || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', medirLimites)
      return () => window.removeEventListener('resize', medirLimites)
    }
    const observer = new ResizeObserver(() => medirLimites())
    observer.observe(ilha)
    return () => observer.disconnect()
  }, [medirLimites, ilhaRef])

  useEffect(() => {
    if (!ativo) {
      alvoRef.current = null
      setQuadro((q) => (q.coluna === 0 ? q : { ...q, coluna: 0 }))
    }
  }, [ativo])

  // Calcula o delta a partir do timestamp bruto (1º parâmetro) em vez de
  // usar o `delta` que o Framer passa como 2º parâmetro: em alguns
  // ambientes esse valor vem limitado/pequeno demais mesmo quando o tempo
  // real entre frames foi bem maior, deixando o movimento muito mais lento
  // que VELOCIDADE_PX_POR_S sugere. Calculando na mão fica correto sempre.
  useAnimationFrame((tempoDesdeInicio) => {
    const alvo = alvoRef.current
    if (!ativo || !alvo) {
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
      // Se a árvore/borda travou o avanço (posição quase não mudou), para de
      // tentar em vez de ficar "empurrando a parede" pra sempre — sem
      // pathfinding de verdade, essa é a versão simples que ainda funciona
      // bem numa demo (ver aviso sobre colisão complexa).
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
          // Mudou de direção no meio do passo: atualiza a linha na hora,
          // sem esperar o próximo quadro do ciclo de caminhada.
          setQuadro((q) => ({ ...q, linha: linhaAtual }))
        }
      }
    }
    persistir()
  })

  useImperativeHandle(refExterno, () => ({
    resetarParaPadrao() {
      alvoRef.current = null
      x.set(posicaoPadraoRef.current.x)
      y.set(posicaoPadraoRef.current.y)
      setQuadro({ linha: LPC_FRAME_ROW, coluna: 0 })
    },
    moverPara(clienteX, clienteY) {
      if (!ativo) return
      const ilha = ilhaRef.current
      if (!ilha) return
      const rect = ilha.getBoundingClientRect()
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
      <motion.div
        className="absolute z-[5]"
        style={{ left: x, top: y }}
        animate={animarPulo}
        transition={transicaoPulo}
      >
        <div style={{ transform: 'translate(-50%, -82%)' }}>
          <AvatarStage
            config={config}
            tamanho={tamanho}
            comMoldura={false}
            linha={quadro.linha}
            coluna={quadro.coluna}
          />
        </div>
      </motion.div>
    </>
  )
})

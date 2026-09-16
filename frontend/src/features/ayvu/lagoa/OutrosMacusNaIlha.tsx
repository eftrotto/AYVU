import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { presencaApi } from '../../../lib/apiClient'
import { AvatarStage } from '../../macu/AvatarStage'
import { AVATAR_PADRAO, LPC_FRAME_ROW } from '../../macu/lpcData'

interface OutrosMacusNaIlhaProps {
  ilhaRef: React.RefObject<HTMLDivElement | null>
  gramaRef: React.RefObject<HTMLDivElement | null>
  ativo: boolean
}

interface Limites {
  cx: number
  cy: number
  rx: number
  ry: number
}

const RAIO_MACU = 30
const INTERVALO_POLLING_MS = 1500

/**
 * Os colegas de ilha, ao vivo (multiplayer via polling — não WebSocket, o
 * backend roda em função serverless no Vercel, que não mantém conexão
 * aberta). Cada aluno manda a própria posição periodicamente (ver
 * MacuNaIlha.tsx); aqui a gente só lê e desenha — sem clique, sem colisão,
 * puramente visual. Mede a MESMA elipse (grama) que MacuNaIlha usa, pra
 * ficar tudo na mesma escala/posição.
 */
export function OutrosMacusNaIlha({ ilhaRef, gramaRef, ativo }: OutrosMacusNaIlhaProps) {
  const limitesRef = useRef<Limites>({ cx: 0, cy: 0, rx: 0, ry: 0 })
  const [, forcarRender] = useState(0)

  useEffect(() => {
    function medir() {
      const ilha = ilhaRef.current
      const grama = gramaRef.current
      if (!ilha || !grama) return
      const ilhaRect = ilha.getBoundingClientRect()
      const gramaRect = grama.getBoundingClientRect()
      if (gramaRect.width < 20 || gramaRect.height < 20) return
      limitesRef.current = {
        cx: gramaRect.left - ilhaRect.left + gramaRect.width / 2,
        cy: gramaRect.top - ilhaRect.top + gramaRect.height / 2,
        rx: Math.max(gramaRect.width / 2 - RAIO_MACU, 10),
        ry: Math.max(gramaRect.height / 2 - RAIO_MACU, 10),
      }
      forcarRender((n) => n + 1)
    }

    medir()
    const ilha = ilhaRef.current
    if (!ilha || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', medir)
      return () => window.removeEventListener('resize', medir)
    }
    const observer = new ResizeObserver(medir)
    observer.observe(ilha)
    return () => observer.disconnect()
  }, [ilhaRef, gramaRef])

  const { data } = useQuery({
    queryKey: ['okas', 'presenca'],
    queryFn: presencaApi.listarDaMinhaIlha,
    refetchInterval: ativo ? INTERVALO_POLLING_MS : false,
    enabled: ativo,
  })

  const { cx, cy, rx, ry } = limitesRef.current
  if (!ativo || !data || data.length === 0 || rx <= 0 || ry <= 0) return null

  return (
    <>
      {data.map((jogador) => {
        const x = cx - rx + jogador.fx * (rx * 2)
        const y = cy - ry + jogador.fy * (ry * 2)
        const config = { ...AVATAR_PADRAO, ...jogador.avatar_config }

        return (
          <motion.div
            key={jogador.user_id}
            className="absolute z-[4]"
            animate={{ left: x, top: y }}
            transition={{ duration: INTERVALO_POLLING_MS / 1000, ease: 'linear' }}
          >
            <div className="relative" style={{ transform: 'translate(-50%, -82%)' }}>
              <AvatarStage config={config} tamanho={132} comMoldura={false} linha={LPC_FRAME_ROW} coluna={0} />
              <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                {jogador.nome}
              </span>
            </div>
          </motion.div>
        )
      })}
    </>
  )
}

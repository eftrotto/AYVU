import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { presencaApi } from '../../lib/apiClient'
import { AvatarStage } from '../macu/AvatarStage'
import { AVATAR_PADRAO, LPC_FRAME_ROW } from '../macu/lpcData'

interface IlhaAoVivoProps {
  okaId: number
}

interface Limites {
  cx: number
  cy: number
  rx: number
  ry: number
}

const RAIO_MACU = 20
const INTERVALO_POLLING_MS = 2000

/**
 * Visão ao vivo da ilha pro professor — a MESMA cena que o aluno vê (ver
 * LagoaCena.tsx), só que compacta e sem Macu/busca próprios (o professor
 * não tem personagem) — só os alunos atualmente presentes, desenhados via
 * polling (mesmo multiplayer da LagoaCena; ver MacuNaIlha.tsx pra quem
 * manda a posição e models.PresencaIlha pro porquê de ser polling).
 */
export function IlhaAoVivo({ okaId }: IlhaAoVivoProps) {
  const ilhaRef = useRef<HTMLDivElement>(null)
  const gramaRef = useRef<HTMLDivElement>(null)
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
        rx: Math.max(gramaRect.width / 2 - RAIO_MACU, 8),
        ry: Math.max(gramaRect.height / 2 - RAIO_MACU, 8),
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
  }, [])

  const { data } = useQuery({
    queryKey: ['okas', okaId, 'presenca'],
    queryFn: () => presencaApi.listarDaOka(okaId),
    refetchInterval: INTERVALO_POLLING_MS,
  })

  const { cx, cy, rx, ry } = limitesRef.current

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl sm:h-80">
      <div ref={ilhaRef} className="absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-[#ffd9a8] via-[#f2a468] to-[#3c7681]" />
        <div className="absolute left-1/2 top-[30%] h-14 w-14 -translate-x-1/2 rounded-full bg-[#ffedc2] opacity-80 blur-[2px]" />
        <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-b from-[#4f8f92] via-[#215a63] to-[#0d2c34]">
          <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#ffd9a8]/40 to-transparent" />
        </div>

        <div className="absolute" style={{ left: '14%', top: '55%', width: '72%', height: '32%' }}>
          <div className="absolute inset-x-0 bottom-0 h-[62%] rounded-[50%] shadow-lg bg-gradient-to-b from-[#e3cd94] to-[#c2a35f]" />
          <div
            ref={gramaRef}
            className="absolute inset-x-[10%] top-0 h-[68%] rounded-[50%] bg-gradient-to-b from-[#5f9448] to-[#3f6c32]"
          />

          {/* Fogueira (pedras + gravetos cruzados, apagada — sem emoji de
              chama, mesma linguagem visual da Oka pessoal) no lugar do
              coqueiro. */}
          <div
            className="absolute z-[1]"
            style={{ left: '50%', top: '34%', width: 70, height: 36, transform: 'translate(-50%, -50%)' }}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 60,
                height: 30,
                background: 'radial-gradient(ellipse, rgba(255,140,40,0.35) 0%, rgba(255,90,20,0) 75%)',
                filter: 'blur(1px)',
              }}
            />
            {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((angulo) => {
              const rad = (angulo * Math.PI) / 180
              const x = 35 + Math.cos(rad) * 27
              const y = 20 + Math.sin(rad) * 10
              return (
                <span
                  key={angulo}
                  className="absolute rounded-[45%] bg-[#8a8072]"
                  style={{ left: x, top: y, width: 8, height: 6, transform: 'translate(-50%, -50%)' }}
                />
              )
            })}
            <span
              className="absolute rounded-full bg-[#5c4530]"
              style={{ left: '50%', top: '55%', width: 38, height: 3, transform: 'translate(-50%, -50%) rotate(-20deg)' }}
            />
            <span
              className="absolute rounded-full bg-[#6b5238]"
              style={{ left: '50%', top: '55%', width: 38, height: 3, transform: 'translate(-50%, -50%) rotate(20deg)' }}
            />
          </div>

          {/* Cavalete com quadro, no canto direito da elipse verde. */}
          <div
            className="absolute z-[1]"
            style={{ left: '80%', top: '46%', width: 44, height: 60, transform: 'translate(-50%, -50%)' }}
          >
            <span
              className="absolute rounded-full bg-[#6b5238]"
              style={{ left: 8.5, top: 44.5, width: 28, height: 2.5, transform: 'translate(-50%, -50%) rotate(104deg)' }}
            />
            <span
              className="absolute rounded-full bg-[#6b5238]"
              style={{ left: 35.5, top: 44.5, width: 28, height: 2.5, transform: 'translate(-50%, -50%) rotate(76deg)' }}
            />
            <span
              className="absolute rounded-full bg-[#5c4530]"
              style={{ left: 21.5, top: 41, width: 36, height: 2.5, transform: 'translate(-50%, -50%) rotate(85deg)' }}
            />
            <span
              className="absolute rounded-full bg-[#5c4530]"
              style={{ left: '50%', top: 30, width: 32, height: 2.5, transform: 'translate(-50%, -50%)' }}
            />
            <div
              className="absolute rounded-[2px] shadow-sm"
              style={{ left: 4, top: 0, width: 36, height: 30, background: '#5c4530' }}
            >
              <div className="absolute rounded-[1px] bg-[#f7f1e3]" style={{ inset: 2 }} />
            </div>
          </div>
        </div>

        {/* Fora da div de 14%/55% de propósito: cx/cy/rx/ry são medidos
            relativos ao ilhaRef (o container inteiro), então o Macu
            também precisa ser posicionado direto nele — aninhado dentro
            daquela div, o left/top calculado ficava relativo ao container
            errado e ele saía do card (bug real, achado testando). */}
        {rx > 0 &&
          ry > 0 &&
          data?.map((jogador) => {
            const x = cx - rx + jogador.fx * (rx * 2)
            const y = cy - ry + jogador.fy * (ry * 2)
            const config = { ...AVATAR_PADRAO, ...jogador.avatar_config }
            return (
              <motion.div
                key={jogador.user_id}
                className="absolute z-[5]"
                animate={{ left: x, top: y }}
                transition={{ duration: INTERVALO_POLLING_MS / 1000, ease: 'linear' }}
              >
                <div className="relative" style={{ transform: 'translate(-50%, -82%)' }}>
                  <AvatarStage config={config} tamanho={64} comMoldura={false} linha={LPC_FRAME_ROW} coluna={0} />
                  <span className="absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/45 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    {jogador.nome}
                  </span>
                </div>
              </motion.div>
            )
          })}
      </div>

      {data && data.length === 0 && (
        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/30 px-3 py-1 text-xs font-medium text-white">
          Ninguém na ilha agora
        </p>
      )}
    </div>
  )
}

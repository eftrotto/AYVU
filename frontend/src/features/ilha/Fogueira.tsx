import { forwardRef } from 'react'
import { motion } from 'framer-motion'

interface FogueiraProps {
  // 0 = apagada (só o professor), 1 = começa um pouco, 2 = acende, 3 = pegando
  // fogo — ver quem calcula isso em IlhaAoVivo.tsx/LagoaCena.tsx (contagem de
  // alunos presentes, via a mesma presença usada no multiplayer).
  nivel: 0 | 1 | 2 | 3
  // Fogueira/Cavalete (ver Cavalete.tsx) são desenhados 1x nesse arquivo e
  // reaproveitados tanto na visão compacta do professor (IlhaAoVivo, escala
  // 1) quanto na cena cheia do aluno (LagoaCena, bem maior) — em vez de
  // recalcular cada valor em px, só escala tudo via transform.
  escala?: number
}

const PEDRAS = [0, 40, 80, 120, 160, 200, 240, 280, 320]

function Chama({ tamanho, offsetX = 0, atraso = 0 }: { tamanho: number; offsetX?: number; atraso?: number }) {
  return (
    <motion.div
      className="absolute"
      style={{ left: 35 + offsetX, bottom: 16, width: tamanho, height: tamanho * 1.35, marginLeft: -tamanho / 2 }}
      animate={{ scaleY: [1, 1.1, 0.93, 1], scaleX: [1, 0.93, 1.05, 1] }}
      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: atraso }}
    >
      <div
        className="absolute inset-0"
        style={{
          borderRadius: '50% 50% 50% 50% / 65% 65% 35% 35%',
          background: 'linear-gradient(to top, #c1442c, #f0862c 55%, #ffd23f 90%)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '26%',
          right: '26%',
          bottom: '4%',
          top: '40%',
          borderRadius: '50% 50% 50% 50% / 65% 65% 35% 35%',
          background: 'linear-gradient(to top, #ffb43f, #fff2b0)',
        }}
      />
    </motion.div>
  )
}

// Configuração de chamas por nível — só o nível 3 ("pegando fogo") tem mais
// de uma chama, pra ficar visivelmente maior/mais vivo que o nível 2.
const CHAMAS_POR_NIVEL: Record<number, { tamanho: number; offsetX?: number; atraso?: number }[]> = {
  1: [{ tamanho: 16 }],
  2: [{ tamanho: 24 }],
  3: [{ tamanho: 28 }, { tamanho: 15, offsetX: -14, atraso: 0.25 }, { tamanho: 15, offsetX: 14, atraso: 0.45 }],
}

export const Fogueira = forwardRef<HTMLDivElement, FogueiraProps>(function Fogueira({ nivel, escala = 1 }, ref) {
  const chamas = CHAMAS_POR_NIVEL[nivel] ?? []

  return (
    <div
      ref={ref}
      // pointer-events-none: puramente decorativa, sem onClick — sem isso
      // ela "rouba" o clique de quem estiver atrás (ver MiniOka.tsx, que
      // fica atrás da fogueira nesse mesmo ponto).
      className="pointer-events-none absolute z-[1]"
      style={{ left: '50%', top: '34%', width: 70, height: 36, transform: `translate(-50%, -50%) scale(${escala})` }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 60 * (1 + nivel * 0.3),
          height: 30 * (1 + nivel * 0.3),
          background: `radial-gradient(ellipse, rgba(255,150,50,${0.22 + nivel * 0.16}) 0%, rgba(255,90,20,0) 75%)`,
          filter: 'blur(1px)',
        }}
      />
      {PEDRAS.map((angulo) => {
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
      {chamas.map((c, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Chama key={i} {...c} />
      ))}
    </div>
  )
})

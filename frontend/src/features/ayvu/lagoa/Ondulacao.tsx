import { motion } from 'framer-motion'

interface OndulacaoProps {
  x: string
  y: string
  tamanho?: number
  cor?: string
  atraso?: number
}

export function Ondulacao({ x, y, tamanho = 220, cor = 'rgba(255,255,255,0.65)', atraso = 0 }: OndulacaoProps) {
  return (
    <div className="pointer-events-none absolute z-10" style={{ left: x, top: y }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: cor, translateX: '-50%', translateY: '-50%' }}
          initial={{ width: 6, height: 6, opacity: 0.85 }}
          animate={{ width: tamanho, height: tamanho, opacity: 0 }}
          transition={{ duration: 1.15, delay: atraso + i * 0.18, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

import { motion } from 'framer-motion'

interface CavaleteProps {
  escala?: number
  // Só o professor pode criar um desafio clicando no quadro — ver
  // IlhaAoVivo.tsx. Sem essa prop (visão do aluno em LagoaCena.tsx), o
  // quadro fica só decorativo.
  onClickQuadro?: (evento: React.MouseEvent) => void
  indicadorAtivo?: boolean
}

export function Cavalete({ escala = 1, onClickQuadro, indicadorAtivo }: CavaleteProps) {
  return (
    <div
      className="absolute z-[1]"
      style={{ left: '80%', top: '46%', width: 44, height: 60, transform: `translate(-50%, -50%) scale(${escala})` }}
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
        className={`absolute rounded-[2px] shadow-sm ${onClickQuadro ? 'cursor-pointer' : ''}`}
        style={{ left: 4, top: 0, width: 36, height: 30, background: '#5c4530' }}
        onClick={onClickQuadro}
      >
        <div className="absolute rounded-[1px] bg-[#f7f1e3]" style={{ inset: 2 }} />
        {indicadorAtivo && (
          <motion.span
            className="absolute h-2 w-2 rounded-full bg-erro"
            style={{ right: -2, top: -2 }}
            animate={{ opacity: [1, 0.35, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  )
}

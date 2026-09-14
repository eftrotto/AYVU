import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { macuApi } from '../../lib/apiClient'

interface NivelBarProps {
  variante?: 'claro' | 'escuro'
  className?: string
}

/** Nível do Macu — derivado da atividade do aluno (ver macu.py), não um
 * contador à parte. Faz polling leve pra refletir XP ganho em outra tela. */
export function NivelBar({ variante = 'claro', className = '' }: NivelBarProps) {
  const { data } = useQuery({
    queryKey: ['macu', 'nivel'],
    queryFn: macuApi.obterNivel,
    refetchInterval: 10000,
  })

  if (!data) return null

  const percentual = Math.min(100, (data.xp_neste_nivel / data.xp_para_proximo_nivel) * 100)
  const corTexto = variante === 'escuro' ? 'text-white/90 drop-shadow-sm' : 'text-text-soft'
  const corTrilha = variante === 'escuro' ? 'bg-white/20' : 'bg-accent-soft'

  return (
    <div className={`w-28 ${className}`}>
      <p className={`mb-1 text-[11px] font-bold ${corTexto}`}>
        Nível {data.nivel}{' '}
        <span className="font-normal opacity-75">
          · {data.xp_neste_nivel}/{data.xp_para_proximo_nivel} XP
        </span>
      </p>
      <div className={`h-1.5 w-full overflow-hidden rounded-full ${corTrilha}`}>
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={false}
          animate={{ width: `${percentual}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

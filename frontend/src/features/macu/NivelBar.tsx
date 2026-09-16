import { useQuery } from '@tanstack/react-query'
import { macuApi } from '../../lib/apiClient'

interface NivelBarProps {
  variante?: 'claro' | 'escuro'
  className?: string
}

/** Saldo de Itás do aluno — derivado da atividade (ver macu.py), não um
 * contador à parte. Faz polling leve pra refletir Itás ganhos em outra tela. */
export function NivelBar({ variante = 'claro', className = '' }: NivelBarProps) {
  const { data } = useQuery({
    queryKey: ['macu', 'itas'],
    queryFn: macuApi.obterItas,
    refetchInterval: 10000,
  })

  if (!data) return null

  const corTexto = variante === 'escuro' ? 'text-white/90 drop-shadow-sm' : 'text-text-soft'

  return (
    <p className={`text-[11px] font-bold ${corTexto} ${className}`}>
      🪨 {data.itas_total} <span className="font-normal opacity-75">Itás</span>
    </p>
  )
}

import { type ButtonHTMLAttributes } from 'react'

type Variante = 'primary' | 'ghost' | 'outline'

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
}

const classesPorVariante: Record<Variante, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-dark disabled:bg-certo disabled:opacity-90 disabled:cursor-default',
  ghost: 'bg-transparent text-secondary hover:text-accent',
  outline:
    'bg-card border border-border text-text-soft hover:border-accent hover:text-accent',
}

export function Button({ variante = 'primary', className = '', ...props }: BotaoProps) {
  return (
    <button
      className={`rounded-full px-5 py-2.5 text-sm font-bold transition-colors duration-150 disabled:cursor-not-allowed ${classesPorVariante[variante]} ${className}`}
      {...props}
    />
  )
}

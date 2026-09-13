interface SpinnerProps {
  rotulo?: string
}

export function Spinner({ rotulo = 'Carregando...' }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-text-soft">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-accent-soft border-t-accent" />
      <p className="text-sm">{rotulo}</p>
    </div>
  )
}

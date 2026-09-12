interface ProgressBarProps {
  percentual: number // 0-100
}

export function ProgressBar({ percentual }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percentual))

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent-soft">
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

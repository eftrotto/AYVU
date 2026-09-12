import { Button } from '../../../components/ui/Button'
import type { Conteudo } from '../../../types/api'

interface LeituraViewerProps {
  conteudo: Conteudo
  jaConcluido: boolean
  aoConcluir: () => void
}

export function LeituraViewer({ conteudo, jaConcluido, aoConcluir }: LeituraViewerProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-border bg-card p-5 text-[1rem] leading-relaxed whitespace-pre-wrap">
        {conteudo.corpo_ou_url}
      </div>
      <Button onClick={aoConcluir} disabled={jaConcluido} className="self-start">
        {jaConcluido ? '✓ Concluído' : 'Marcar como concluído'}
      </Button>
    </div>
  )
}

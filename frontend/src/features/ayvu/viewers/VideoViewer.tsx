import { Button } from '../../../components/ui/Button'
import type { Conteudo } from '../../../types/api'

interface VideoViewerProps {
  conteudo: Conteudo
  jaConcluido: boolean
  aoConcluir: () => void
}

export function VideoViewer({ conteudo, jaConcluido, aoConcluir }: VideoViewerProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          src={conteudo.corpo_ou_url}
          title={conteudo.titulo}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
      <Button onClick={aoConcluir} disabled={jaConcluido} className="self-start">
        {jaConcluido ? '✓ Concluído' : 'Marcar como concluído'}
      </Button>
    </div>
  )
}

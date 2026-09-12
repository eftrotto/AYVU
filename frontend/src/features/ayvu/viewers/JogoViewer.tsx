import { useMemo, useState } from 'react'
import type { Conteudo, QuizConteudo } from '../../../types/api'

interface JogoViewerProps {
  conteudo: Conteudo
  jaConcluido: boolean
  aoConcluir: () => void
}

export function JogoViewer({ conteudo, jaConcluido, aoConcluir }: JogoViewerProps) {
  const [respondida, setRespondida] = useState(jaConcluido)
  const [indiceEscolhido, setIndiceEscolhido] = useState<number | null>(null)

  const quiz = useMemo<QuizConteudo | null>(() => {
    try {
      return JSON.parse(conteudo.corpo_ou_url) as QuizConteudo
    } catch {
      return null
    }
  }, [conteudo.corpo_ou_url])

  if (!quiz) {
    return <p className="text-sm text-erro">Não foi possível carregar este jogo agora.</p>
  }

  function escolher(indice: number) {
    if (respondida) return
    setIndiceEscolhido(indice)
    setRespondida(true)
    aoConcluir()
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-lg font-semibold text-text">{quiz.pergunta}</p>

      <div className="flex flex-col gap-2.5">
        {quiz.alternativas.map((alternativa, indice) => {
          const ehCorreta = indice === quiz.correta
          const ehEscolhida = indice === indiceEscolhido

          let classe = 'border-border bg-card hover:border-accent'
          if (respondida && ehCorreta) classe = 'border-certo bg-secondary-soft'
          else if (respondida && ehEscolhida && !ehCorreta) classe = 'border-erro bg-erro-soft'

          return (
            <button
              key={alternativa}
              type="button"
              disabled={respondida}
              onClick={() => escolher(indice)}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium text-text transition-colors disabled:cursor-default ${classe}`}
            >
              {alternativa}
            </button>
          )
        })}
      </div>

      {respondida && (
        <p className="text-sm font-semibold text-secondary">
          {indiceEscolhido === quiz.correta || indiceEscolhido === null
            ? quiz.feedback_certo
            : quiz.feedback_errado}
        </p>
      )}
    </div>
  )
}

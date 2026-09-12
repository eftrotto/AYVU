interface ErrorMessageProps {
  mensagem: string
  aoTentarNovamente?: () => void
}

/** Mensagem de erro amigável — nunca mostra stack trace/status cru pro usuário. */
export function ErrorMessage({ mensagem, aoTentarNovamente }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-erro-soft px-4 py-6 text-center">
      <span className="text-2xl" aria-hidden>
        😕
      </span>
      <p className="text-sm font-medium text-erro">{mensagem}</p>
      {aoTentarNovamente && (
        <button
          type="button"
          onClick={aoTentarNovamente}
          className="text-sm font-bold text-erro underline underline-offset-2"
        >
          Tentar de novo
        </button>
      )}
    </div>
  )
}

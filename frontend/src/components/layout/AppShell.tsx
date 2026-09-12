import type { ReactNode } from 'react'
import { useAuth } from '../../features/auth/AuthContext'

interface AppShellProps {
  children: ReactNode
  largura?: 'sm' | 'md' | 'lg'
  voltar?: { rotulo: string; aoClicar: () => void }
}

const larguraMaxima: Record<NonNullable<AppShellProps['largura']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
}

/** Casca comum das telas autenticadas: logo, nome do usuário, botão sair. */
export function AppShell({ children, largura = 'lg', voltar }: AppShellProps) {
  const { usuario, sair } = useAuth()

  return (
    <div className="min-h-dvh bg-bg">
      <div className={`mx-auto ${larguraMaxima[largura]} px-5 py-7`}>
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <img src="/assets/logo.png" alt="AYVU" className="mb-2 h-8 w-auto" />
            {voltar && (
              <button
                type="button"
                onClick={voltar.aoClicar}
                className="mb-1 block text-sm font-bold text-text-soft hover:text-secondary"
              >
                ‹ {voltar.rotulo}
              </button>
            )}
          </div>

          {usuario && (
            <button
              type="button"
              onClick={sair}
              className="flex-none rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-text-soft hover:border-accent hover:text-accent"
            >
              Sair
            </button>
          )}
        </header>

        <main>{children}</main>
      </div>
    </div>
  )
}

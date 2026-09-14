import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { NivelBar } from '../../features/macu/NivelBar'

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

export function AppShell({ children, largura = 'lg', voltar }: AppShellProps) {
  const { usuario, sair } = useAuth()

  return (
    <div className="min-h-dvh bg-bg">
      <div className={`mx-auto ${larguraMaxima[largura]} px-5 py-7`}>
        <header className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="justify-self-start">
            {voltar && (
              <button
                type="button"
                onClick={voltar.aoClicar}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-text-soft hover:border-accent hover:text-accent"
              >
                ‹ {voltar.rotulo}
              </button>
            )}
          </div>

          <div className="flex flex-col items-center">
            <img src="/assets/logo.png" alt="AYVU" className="mb-2 h-8 w-auto" />
            {usuario?.tipo === 'aluno' && <NivelBar />}
          </div>

          <div className="justify-self-end">
            {usuario && (
              <div className="flex flex-none items-center gap-2">
                {usuario.tipo === 'aluno' && (
                  <Link
                    to="/aluno/macu"
                    className="rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-text-soft hover:border-accent hover:text-accent"
                  >
                    🧑‍🎨 Meu Macu
                  </Link>
                )}
                <button
                  type="button"
                  onClick={sair}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-text-soft hover:border-accent hover:text-accent"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  )
}

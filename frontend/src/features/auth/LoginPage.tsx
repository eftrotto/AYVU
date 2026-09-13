import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/Button'
import { ApiError } from '../../lib/apiClient'
import { useAuth } from './AuthContext'
import type { TipoUsuario } from '../../types/api'

export function LoginPage() {
  const { usuario, fazerLogin, cadastrar } = useAuth()
  const navigate = useNavigate()

  const [modoCadastro, setModoCadastro] = useState(false)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoUsuario>('aluno')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (usuario) {
    return <Navigate to={usuario.tipo === 'professor' ? '/professor' : '/aluno'} replace />
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)

    try {
      if (modoCadastro) {
        await cadastrar({ nome, email, senha, tipo })
      }
      const usuarioLogado = await fazerLogin(email, senha)
      navigate(usuarioLogado.tipo === 'professor' ? '/professor' : '/aluno', { replace: true })
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Algo deu errado. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-5 py-10">
      <div className="w-full max-w-sm">
        <header className="mb-7 text-center">
          <img src="/assets/logo.png" alt="AYVU" className="mx-auto mb-2 h-10 w-auto" />
          <h1 className="text-xl font-bold text-text">Educação que escuta</h1>
        </header>

        <motion.div
          layout
          className="rounded-3xl border border-border bg-card p-7 shadow-warm"
        >
          <form onSubmit={aoSubmeter} className="flex flex-col gap-4">
            <Campo label="E-mail">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={estiloInput}
              />
            </Campo>

            <Campo label="Senha">
              <input
                type="password"
                required
                minLength={6}
                autoComplete={modoCadastro ? 'new-password' : 'current-password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className={estiloInput}
              />
            </Campo>

            {modoCadastro && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-4 overflow-hidden"
              >
                <Campo label="Nome">
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className={estiloInput}
                  />
                </Campo>

                <Campo label="Eu sou">
                  <div className="flex gap-2">
                    {(['aluno', 'professor'] as const).map((opcao) => (
                      <button
                        key={opcao}
                        type="button"
                        onClick={() => setTipo(opcao)}
                        className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold capitalize transition-colors ${
                          tipo === opcao
                            ? 'border-accent bg-accent-soft text-text'
                            : 'border-border bg-[#fffaf3] text-text-soft'
                        }`}
                      >
                        {opcao}
                      </button>
                    ))}
                  </div>
                </Campo>
              </motion.div>
            )}

            {erro && (
              <p role="alert" className="rounded-xl bg-erro-soft px-3 py-2 text-sm font-semibold text-erro">
                {erro}
              </p>
            )}

            <Button type="submit" disabled={enviando}>
              {enviando ? 'Um instante...' : modoCadastro ? 'Criar conta' : 'Entrar'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setModoCadastro((atual) => !atual)
              setErro(null)
            }}
            className="mx-auto mt-4 block text-sm font-bold text-secondary hover:text-accent"
          >
            {modoCadastro ? 'Já tenho conta' : 'Criar conta'}
          </button>
        </motion.div>

        <p className="mt-6 text-center text-xs text-text-soft">
          MVP de hackathon: login simples só pra demonstrar o fluxo. Sem recuperação de
          senha, verificação de e-mail ou proteção contra força bruta nesta etapa.
        </p>
      </div>
    </div>
  )
}

const estiloInput =
  'rounded-xl border border-border bg-[#fffaf3] px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent'

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-bold text-text">
      {label}
      {children}
    </label>
  )
}

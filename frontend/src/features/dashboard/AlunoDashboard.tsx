import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { useAuth } from '../auth/AuthContext'

const PILARES = [
  { rota: '/aluno/macu', emoji: '🧑‍🎨', titulo: 'Macu', descricao: 'Como você se expressa' },
  { rota: '/aluno/reko', emoji: '🌱', titulo: 'Reko', descricao: 'Como você está' },
  { rota: '/aluno/ayvu', emoji: '🧭', titulo: 'Ayvu', descricao: 'O que te move' },
] as const

export function AlunoDashboard() {
  const { usuario } = useAuth()

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-bold text-text">Olá, {usuario?.nome.split(' ')[0]}!</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PILARES.map((pilar, indice) => (
          <motion.div
            key={pilar.rota}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: indice * 0.06 }}
          >
            <Link
              to={pilar.rota}
              className="flex h-full flex-col items-start gap-2 rounded-3xl border border-border bg-card p-7 shadow-warm transition-transform hover:-translate-y-1"
            >
              <span className="text-3xl" aria-hidden>
                {pilar.emoji}
              </span>
              <h2 className="text-lg font-bold text-text">{pilar.titulo}</h2>
              <p className="text-sm text-text-soft">{pilar.descricao}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </AppShell>
  )
}

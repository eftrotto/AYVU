import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ProgressBar } from '../../components/ui/ProgressBar'
import type { Tema } from '../../types/api'

interface TemaCardProps {
  tema: Tema
  concluidos: number
  indice: number
}

export function TemaCard({ tema, concluidos, indice }: TemaCardProps) {
  const percentual = tema.total_conteudos > 0 ? (concluidos / tema.total_conteudos) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: indice * 0.04 }}
    >
      <Link
        to={`/aluno/ayvu/${tema.id}`}
        className="flex h-full flex-col items-start gap-2 rounded-3xl border border-border bg-card p-6 text-left shadow-warm transition-transform hover:-translate-y-1"
      >
        <span className="rounded-full bg-secondary-soft px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-secondary">
          {tema.dentro_do_curriculo ? 'Currículo' : 'Curiosidade'}
        </span>
        <h3 className="text-base font-bold text-text">{tema.nome}</h3>
        <p className="text-sm text-text-soft">{tema.descricao}</p>

        <div className="mt-2 flex w-full flex-col gap-1.5">
          <ProgressBar percentual={percentual} />
          <span className="text-xs font-semibold text-text-soft">
            {concluidos} de {tema.total_conteudos} conteúdos explorados
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

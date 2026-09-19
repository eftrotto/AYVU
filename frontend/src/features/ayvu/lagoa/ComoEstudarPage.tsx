import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { MODOS } from './modos'

export function ComoEstudarPage() {
  const { tema = '' } = useParams<{ tema: string }>()
  const navigate = useNavigate()
  const termo = decodeURIComponent(tema)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_#5fe0d4_0%,_#22a6bd_42%,_#0b3f6b_100%)]"
    >
      <div className="mx-auto max-w-4xl px-5 py-10">
        <motion.button
          type="button"
          onClick={() => navigate('/aluno/ayvu')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8 text-sm font-bold text-white/90 hover:text-white"
        >
          ‹ Pesquisar outra coisa
        </motion.button>

        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mb-9 text-center"
        >
          <span className="mb-3 inline-block rounded-full bg-white/45 px-4 py-1.5 text-sm font-semibold text-[#0e3f43] backdrop-blur">
            {termo}
          </span>
          <h1 className="text-2xl font-bold text-[#0e3f43] sm:text-3xl">Como você quer estudar isso?</h1>
          <p className="mt-1 text-sm text-[#0e3f43]/70">Escolha o jeito que combina com você.</p>
        </motion.header>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {MODOS.map((modo, indice) => (
            <motion.button
              key={modo.chave}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + indice * 0.06, duration: 0.4 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/aluno/ayvu/explorar/${tema}/${modo.chave}`)}
              className="flex flex-col items-start gap-2 rounded-3xl border border-border bg-card p-6 text-left shadow-warm transition-shadow hover:shadow-lg"
            >
              <span className="text-2xl" aria-hidden>
                {modo.emoji}
              </span>
              <h2 className="text-base font-bold text-text">{modo.rotulo}</h2>
              <p className="text-sm text-text-soft">{modo.descricao}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

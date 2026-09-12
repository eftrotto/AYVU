import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../../components/layout/AppShell'
import { Card } from '../../../components/ui/Card'
import { gerarConteudoDoTema } from './conteudoGerado'
import { MODOS } from './modos'

export function TemaExploracaoPage() {
  const { tema = '', modo: modoChave = '' } = useParams<{ tema: string; modo: string }>()
  const navigate = useNavigate()

  const termo = decodeURIComponent(tema)
  const modo = MODOS.find((m) => m.chave === modoChave) ?? MODOS[0]
  const conteudo = useMemo(() => gerarConteudoDoTema(termo, modo), [termo, modo])

  return (
    <AppShell
      largura="md"
      voltar={{ rotulo: 'Escolher outro jeito de estudar', aoClicar: () => navigate(`/aluno/ayvu/estudar/${tema}`) }}
    >
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-7"
      >
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-secondary-soft px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-secondary">
          <span aria-hidden>{modo.emoji}</span> {modo.rotulo}
        </span>
        <h1 className="text-2xl font-bold text-text sm:text-3xl">{conteudo.titulo}</h1>
        <p className="mt-1.5 text-sm text-text-soft">{conteudo.introducao}</p>
      </motion.header>

      <div className="flex flex-col gap-5">
        <Secao titulo="Conceitos relacionados" indice={0}>
          <div className="flex flex-wrap gap-2">
            {conteudo.conceitosRelacionados.map((c) => (
              <span key={c} className="rounded-full border border-border bg-[#fffaf3] px-3.5 py-1.5 text-sm text-text">
                {c}
              </span>
            ))}
          </div>
        </Secao>

        <Secao titulo="Perguntas pra pensar" indice={1}>
          <ul className="flex flex-col gap-2">
            {conteudo.perguntas.map((p) => (
              <li key={p} className="rounded-2xl bg-[#fffaf3] px-4 py-3 text-sm text-text">
                {p}
              </li>
            ))}
          </ul>
        </Secao>

        <Secao titulo="Curiosidades" indice={2}>
          <ul className="flex flex-col gap-2">
            {conteudo.curiosidades.map((c) => (
              <li key={c} className="flex gap-2 text-sm text-text">
                <span aria-hidden>✨</span>
                {c}
              </li>
            ))}
          </ul>
        </Secao>

        <Secao titulo="Atividades" indice={3}>
          <ul className="flex flex-col gap-2">
            {conteudo.atividades.map((a) => (
              <li key={a} className="flex gap-2 text-sm text-text">
                <span aria-hidden>🖊️</span>
                {a}
              </li>
            ))}
          </ul>
        </Secao>

        <Secao titulo="Recomendações" indice={4}>
          <div className="flex flex-col gap-2 sm:flex-row">
            {conteudo.recomendacoes.map((r) => (
              <Card key={r} className="flex-1 p-4 text-sm font-semibold text-text">
                {r}
              </Card>
            ))}
          </div>
        </Secao>
      </div>
    </AppShell>
  )
}

function Secao({ titulo, indice, children }: { titulo: string; indice: number; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * indice }}
    >
      <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-secondary">{titulo}</h2>
      {children}
    </motion.section>
  )
}

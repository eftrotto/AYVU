import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../../components/layout/AppShell'
import { Card } from '../../../components/ui/Card'
import { gerarConteudoDoTema } from './conteudoGerado'
import { MODOS, type ModoChave } from './modos'

export function TemaExploracaoPage() {
  const { tema = '', modo: modoParam = '' } = useParams<{ tema: string; modo: string }>()
  const navigate = useNavigate()

  const termo = decodeURIComponent(tema)
  const modo = MODOS.find((m) => m.chave === modoParam) ?? MODOS[0]
  const conteudo = useMemo(() => gerarConteudoDoTema(termo, modo.chave as ModoChave), [termo, modo.chave])

  return (
    <AppShell
      largura="md"
      voltar={{ rotulo: 'Escolher outro jeito de estudar', aoClicar: () => navigate(`/aluno/ayvu/estudar/${tema}`) }}
    >
      <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-secondary-soft px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-secondary">
          <span aria-hidden>{modo.emoji}</span> {modo.rotulo}
        </span>
        <h1 className="text-2xl font-bold text-text sm:text-3xl">{conteudo.titulo}</h1>
        <p className="mt-1.5 text-sm text-text-soft">{conteudo.introducao}</p>
      </motion.header>

      {conteudo.tipo === 'entender' && (
        <div className="flex flex-col gap-5">
          <Secao titulo="Em poucas palavras" indice={0}>
            <Card className="p-5 text-sm leading-relaxed text-text">{conteudo.explicacao}</Card>
          </Secao>
          <Secao titulo="Conceitos relacionados" indice={1}>
            <div className="flex flex-wrap gap-2">
              {conteudo.conceitosRelacionados.map((c) => (
                <span key={c} className="rounded-full border border-border bg-[#fffaf3] px-3.5 py-1.5 text-sm text-text">
                  {c}
                </span>
              ))}
            </div>
          </Secao>
        </div>
      )}

      {conteudo.tipo === 'assistir' && (
        <div className="flex flex-col gap-5">
          <Secao titulo="Vídeos sugeridos" indice={0}>
            <div className="flex flex-col gap-2.5">
              {conteudo.videos.map((v) => (
                <Card key={v.titulo} className="flex items-center justify-between gap-3 p-4">
                  <span className="flex items-center gap-3 text-sm font-semibold text-text">
                    <span aria-hidden className="text-xl">
                      ▶️
                    </span>
                    {v.titulo}
                  </span>
                  <span className="text-xs font-bold text-text-soft">{v.duracao}</span>
                </Card>
              ))}
            </div>
          </Secao>
          <Secao titulo="Enquanto assiste" indice={1}>
            <p className="rounded-2xl bg-[#fffaf3] px-4 py-3 text-sm text-text">{conteudo.dicaDeAtencao}</p>
          </Secao>
        </div>
      )}

      {conteudo.tipo === 'praticar' && (
        <Secao titulo="Exercícios" indice={0}>
          <ExerciciosLista itens={conteudo.exercicios} />
        </Secao>
      )}

      {conteudo.tipo === 'conversar' && (
        <div className="flex flex-col gap-5">
          <Secao titulo="Pra puxar assunto" indice={0}>
            <ul className="flex flex-col gap-2">
              {conteudo.perguntasAbertas.map((p) => (
                <li key={p} className="rounded-2xl bg-[#fffaf3] px-4 py-3 text-sm text-text">
                  {p}
                </li>
              ))}
            </ul>
          </Secao>
          <Secao titulo="Com quem conversar" indice={1}>
            <div className="flex flex-wrap gap-2">
              {conteudo.comQuemConversar.map((c) => (
                <span key={c} className="rounded-full border border-border bg-[#fffaf3] px-3.5 py-1.5 text-sm text-text">
                  {c}
                </span>
              ))}
            </div>
          </Secao>
        </div>
      )}

      {conteudo.tipo === 'testar' && <Autoavaliacao pergunta={conteudo.pergunta} opcoes={conteudo.opcoes} />}

      {conteudo.tipo === 'explorar' && (
        <div className="flex flex-col gap-5">
          <Secao titulo="Curiosidades" indice={0}>
            <ul className="flex flex-col gap-2">
              {conteudo.curiosidades.map((c) => (
                <li key={c} className="flex gap-2 text-sm text-text">
                  <span aria-hidden>✨</span>
                  {c}
                </li>
              ))}
            </ul>
          </Secao>
          <Secao titulo="Caminhos inesperados" indice={1}>
            <div className="flex flex-col gap-2 sm:flex-row">
              {conteudo.caminhosInesperados.map((c) => (
                <Card key={c} className="flex-1 p-4 text-sm font-semibold text-text">
                  {c}
                </Card>
              ))}
            </div>
          </Secao>
        </div>
      )}

      {conteudo.tipo === 'criar' && (
        <Secao titulo="Ideias pra criar" indice={0}>
          <ul className="flex flex-col gap-2">
            {conteudo.ideias.map((i) => (
              <li key={i} className="flex gap-2 text-sm text-text">
                <span aria-hidden>🖊️</span>
                {i}
              </li>
            ))}
          </ul>
        </Secao>
      )}
    </AppShell>
  )
}

function Secao({ titulo, indice, children }: { titulo: string; indice: number; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * indice }}>
      <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-secondary">{titulo}</h2>
      {children}
    </motion.section>
  )
}

function ExerciciosLista({ itens }: { itens: string[] }) {
  const [feitos, setFeitos] = useState<Record<number, boolean>>({})

  return (
    <ul className="flex flex-col gap-2">
      {itens.map((item, indice) => (
        <li key={item}>
          <button
            type="button"
            onClick={() => setFeitos((atual) => ({ ...atual, [indice]: !atual[indice] }))}
            className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
              feitos[indice] ? 'border-certo bg-secondary-soft text-text' : 'border-border bg-[#fffaf3] text-text hover:border-accent'
            }`}
          >
            <span aria-hidden>{feitos[indice] ? '✅' : '⬜'}</span>
            {item}
          </button>
        </li>
      ))}
    </ul>
  )
}

function Autoavaliacao({ pergunta, opcoes }: { pergunta: string; opcoes: string[] }) {
  const [escolhida, setEscolhida] = useState<number | null>(null)

  return (
    <Secao titulo="Autoavaliação rápida" indice={0}>
      <p className="mb-3 text-sm font-semibold text-text">{pergunta}</p>
      <div className="flex flex-col gap-2.5">
        {opcoes.map((opcao, indice) => (
          <button
            key={opcao}
            type="button"
            onClick={() => setEscolhida(indice)}
            className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
              escolhida === indice ? 'border-accent bg-accent-soft text-text' : 'border-border bg-[#fffaf3] text-text hover:border-accent'
            }`}
          >
            {opcao}
          </button>
        ))}
      </div>
      {escolhida !== null && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm font-semibold text-secondary"
        >
          Sem certo ou errado aqui — isso só te ajuda a decidir por onde continuar.
        </motion.p>
      )}
    </Secao>
  )
}

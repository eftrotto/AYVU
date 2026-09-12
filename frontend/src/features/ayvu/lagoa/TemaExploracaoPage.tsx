import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../../components/layout/AppShell'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ayvuApi } from '../../../lib/apiClient'
import { gerarConteudoDoTema, type PerguntaAutoavaliacao } from './conteudoGerado'
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
                <a
                  key={c}
                  href={`https://www.google.com/search?q=${encodeURIComponent(c)}&safe=active`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-border bg-[#fffaf3] px-3.5 py-1.5 text-sm text-text transition-colors hover:border-accent hover:bg-accent-soft"
                >
                  {c}
                </a>
              ))}
            </div>
          </Secao>
        </div>
      )}

      {conteudo.tipo === 'assistir' && (
        <div className="flex flex-col gap-5">
          <Secao titulo="Vídeos sobre o tema" indice={0}>
            <VideosSugeridos termo={termo} />
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

      {conteudo.tipo === 'testar' && <Autoavaliacao perguntas={conteudo.perguntas} tema={tema} />}

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
                <a
                  key={c}
                  href={`https://www.google.com/search?q=${encodeURIComponent(c)}&safe=active`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Card className="h-full p-4 text-sm font-semibold text-text transition-colors hover:border-accent hover:bg-accent-soft">
                    {c}
                  </Card>
                </a>
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

function VideosSugeridos({ termo }: { termo: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ayvu', 'videos', termo],
    queryFn: () => ayvuApi.buscarVideos(termo),
    retry: false,
  })

  if (isLoading) {
    return <p className="text-sm text-text-soft">Buscando vídeos sobre {termo}...</p>
  }

  if (isError) {
    return (
      <p className="rounded-2xl bg-erro-soft px-4 py-3 text-sm text-erro">
        Não foi possível buscar vídeos agora. Tente de novo mais tarde.
      </p>
    )
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-text-soft">Nenhum vídeo encontrado pra esse termo.</p>
  }

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((video) => (
        <a key={video.id} href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
          <Card className="flex items-center gap-3 overflow-hidden p-3 transition-colors hover:border-accent">
            <img
              src={video.miniatura}
              alt=""
              className="h-16 w-28 flex-shrink-0 rounded-xl bg-[#fffaf3] object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">{video.titulo}</p>
              <p className="truncate text-xs text-text-soft">{video.canal}</p>
            </div>
          </Card>
        </a>
      ))}
    </div>
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

const OPCOES_AUTOAVALIACAO = [
  { valor: 0, rotulo: 'Não' },
  { valor: 1, rotulo: 'Mais ou menos' },
  { valor: 2, rotulo: 'Sim' },
]

function recomendarModo(soma: number): ModoChave {
  if (soma <= 2) return 'entender'
  if (soma <= 4) return 'praticar'
  return 'criar'
}

function Autoavaliacao({ perguntas, tema }: { perguntas: PerguntaAutoavaliacao[]; tema: string }) {
  const navigate = useNavigate()
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, number>>({})

  function responder(valor: number) {
    setRespostas((r) => ({ ...r, [perguntas[indice].chave]: valor }))
    setIndice((i) => i + 1)
  }

  if (indice >= perguntas.length) {
    const soma = Object.values(respostas).reduce((acc, v) => acc + v, 0)
    const modo = MODOS.find((m) => m.chave === recomendarModo(soma))!

    return (
      <Secao titulo="Resultado" indice={0}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="flex flex-col items-start gap-3 p-5">
            <p className="text-sm text-text">
              Sem certo ou errado aqui — pelas suas respostas, o que mais combina agora é:
            </p>
            <div className="flex items-center gap-2 text-lg font-bold text-text">
              <span aria-hidden>{modo.emoji}</span> {modo.rotulo}
            </div>
            <p className="text-sm text-text-soft">{modo.descricao}</p>
            <Button onClick={() => navigate(`/aluno/ayvu/explorar/${tema}/${modo.chave}`)}>
              Ir pra "{modo.rotulo}"
            </Button>
          </Card>
        </motion.div>
      </Secao>
    )
  }

  const pergunta = perguntas[indice]

  return (
    <Secao titulo={`Pergunta ${indice + 1} de ${perguntas.length}`} indice={0}>
      <motion.div key={pergunta.chave} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="mb-3 text-sm font-semibold text-text">{pergunta.pergunta}</p>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          {OPCOES_AUTOAVALIACAO.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => responder(opcao.valor)}
              className="flex-1 rounded-2xl border border-border bg-[#fffaf3] px-4 py-3 text-center text-sm font-semibold text-text transition-colors hover:border-accent"
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </motion.div>
    </Secao>
  )
}

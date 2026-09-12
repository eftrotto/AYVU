import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Spinner } from '../../components/ui/Spinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { ApiError } from '../../lib/apiClient'
import type { Conteudo, TipoConteudo } from '../../types/api'
import { useMarcarProgresso, useProgresso, useTemaDetalhe } from './hooks'
import { VideoViewer } from './viewers/VideoViewer'
import { LeituraViewer } from './viewers/LeituraViewer'
import { JogoViewer } from './viewers/JogoViewer'
import { DesafioViewer } from './viewers/DesafioViewer'

const ABAS: { chave: TipoConteudo; rotulo: string; icone: string }[] = [
  { chave: 'video', rotulo: 'Vídeos', icone: '🎬' },
  { chave: 'jogo', rotulo: 'Jogos', icone: '🎲' },
  { chave: 'leitura', rotulo: 'Leitura', icone: '📖' },
  { chave: 'desafio', rotulo: 'Desafios', icone: '🧭' },
]

export function AyvuTemaPage() {
  const { temaId } = useParams<{ temaId: string }>()
  const id = Number(temaId)
  const navigate = useNavigate()

  const temaQuery = useTemaDetalhe(id)
  const progresso = useProgresso()
  const marcarProgresso = useMarcarProgresso()

  const [abaAtiva, setAbaAtiva] = useState<TipoConteudo | null>(null)
  const [conteudoAtual, setConteudoAtual] = useState<Conteudo | null>(null)

  const conteudosPorTipo = temaQuery.data?.conteudos_por_tipo
  const abaEfetiva = useMemo<TipoConteudo | null>(() => {
    if (abaAtiva) return abaAtiva
    if (!conteudosPorTipo) return null
    return ABAS.find((a) => (conteudosPorTipo[a.chave]?.length ?? 0) > 0)?.chave ?? 'video'
  }, [abaAtiva, conteudosPorTipo])

  function estaConcluido(conteudoId: number): boolean {
    return progresso.data?.itens.some((i) => i.conteudo_id === conteudoId && i.concluido) ?? false
  }

  if (temaQuery.isLoading) {
    return (
      <AppShell voltar={{ rotulo: 'Todos os temas', aoClicar: () => navigate('/aluno/ayvu') }}>
        <Spinner rotulo="Carregando tema..." />
      </AppShell>
    )
  }

  if (temaQuery.isError || !temaQuery.data) {
    return (
      <AppShell voltar={{ rotulo: 'Todos os temas', aoClicar: () => navigate('/aluno/ayvu') }}>
        <ErrorMessage
          mensagem={temaQuery.error instanceof ApiError ? temaQuery.error.message : 'Não foi possível carregar este tema.'}
          aoTentarNovamente={() => temaQuery.refetch()}
        />
      </AppShell>
    )
  }

  const tema = temaQuery.data

  if (conteudoAtual) {
    const jaConcluido = estaConcluido(conteudoAtual.id)
    const aoConcluir = () => marcarProgresso.mutate({ conteudoId: conteudoAtual.id })

    return (
      <AppShell largura="md" voltar={{ rotulo: 'Voltar pro tema', aoClicar: () => setConteudoAtual(null) }}>
        <h1 className="mb-5 text-xl font-bold text-text">{conteudoAtual.titulo}</h1>

        {conteudoAtual.tipo === 'video' && (
          <VideoViewer conteudo={conteudoAtual} jaConcluido={jaConcluido} aoConcluir={aoConcluir} />
        )}
        {conteudoAtual.tipo === 'leitura' && (
          <LeituraViewer conteudo={conteudoAtual} jaConcluido={jaConcluido} aoConcluir={aoConcluir} />
        )}
        {conteudoAtual.tipo === 'jogo' && (
          <JogoViewer conteudo={conteudoAtual} jaConcluido={jaConcluido} aoConcluir={aoConcluir} />
        )}
        {conteudoAtual.tipo === 'desafio' && (
          <DesafioViewer conteudo={conteudoAtual} jaConcluido={jaConcluido} aoConcluir={aoConcluir} />
        )}
      </AppShell>
    )
  }

  const itensDaAba = abaEfetiva ? tema.conteudos_por_tipo[abaEfetiva] ?? [] : []

  return (
    <AppShell voltar={{ rotulo: 'Todos os temas', aoClicar: () => navigate('/aluno/ayvu') }}>
      <header className="mb-5">
        <h1 className="text-xl font-bold text-text">{tema.nome}</h1>
        <p className="text-sm text-text-soft">{tema.descricao}</p>
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        {ABAS.map((aba) => {
          const quantidade = tema.conteudos_por_tipo[aba.chave]?.length ?? 0
          return (
            <button
              key={aba.chave}
              type="button"
              disabled={quantidade === 0}
              onClick={() => setAbaAtiva(aba.chave)}
              className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                abaEfetiva === aba.chave
                  ? 'border-accent bg-accent-soft text-text'
                  : 'border-border bg-card text-text-soft'
              }`}
            >
              {aba.icone} {aba.rotulo} ({quantidade})
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-2.5">
        {itensDaAba.length === 0 && (
          <p className="text-sm text-text-soft">Nenhum conteúdo desse tipo ainda por aqui.</p>
        )}

        {itensDaAba.map((conteudo) => {
          const concluido = estaConcluido(conteudo.id)
          return (
            <button
              key={conteudo.id}
              type="button"
              onClick={() => setConteudoAtual(conteudo)}
              className={`flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-colors hover:border-accent ${
                concluido ? 'border-border bg-secondary-soft' : 'border-border bg-card'
              }`}
            >
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-text">
                {conteudo.ordem_sugerida}
              </span>
              <span className="flex-1 text-sm font-semibold text-text">{conteudo.titulo}</span>
              {concluido && <span className="font-bold text-certo">✓</span>}
            </button>
          )
        })}
      </div>
    </AppShell>
  )
}

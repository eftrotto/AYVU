import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppShell } from '../../components/layout/AppShell'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { ApiError, rekoApi, turmaApi } from '../../lib/apiClient'
import { useAuth } from '../auth/AuthContext'
import type { RekoMedias, SinalBemEstar, Turma } from '../../types/api'

const ROTULOS_COMPETENCIA: Record<keyof RekoMedias, string> = {
  autoconhecimento: 'Autoconhecimento',
  autogestao: 'Autogestão',
  consciencia_social: 'Consciência social',
  relacionamento: 'Relacionamento',
  decisao_responsavel: 'Decisão responsável',
}

const SINAL_INFO: Record<SinalBemEstar, { emoji: string; rotulo: string; classe: string }> = {
  bem: { emoji: '🙂', rotulo: 'Bem', classe: 'bg-secondary-soft text-secondary' },
  neutro: { emoji: '😐', rotulo: 'Neutro', classe: 'bg-[#fff3d6] text-[#8a6d1f]' },
  atencao: { emoji: '💛', rotulo: 'Atenção', classe: 'bg-erro-soft text-erro' },
  sem_dados: { emoji: '—', rotulo: 'Sem dados', classe: 'bg-[#f0e0cb] text-text-soft' },
}

export function ProfessorDashboard() {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()

  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState<number | null>(null)
  const [nomeNovaTurma, setNomeNovaTurma] = useState('')
  const [codigoCopiado, setCodigoCopiado] = useState(false)

  const turmasQuery = useQuery({ queryKey: ['turmas'], queryFn: turmaApi.listarMinhas })

  // assim que a lista de turmas chega, seleciona a primeira automaticamente
  // (evita a tela vazia "escolha uma turma" quando só existe uma).
  useEffect(() => {
    if (turmaSelecionadaId === null && turmasQuery.data && turmasQuery.data.length > 0) {
      setTurmaSelecionadaId(turmasQuery.data[0].id)
    }
  }, [turmasQuery.data, turmaSelecionadaId])

  const criarTurma = useMutation({
    mutationFn: (nome: string) => turmaApi.criar(nome),
    onSuccess: (turma) => {
      queryClient.setQueryData<Turma[]>(['turmas'], (atual) => [turma, ...(atual ?? [])])
      setNomeNovaTurma('')
      setTurmaSelecionadaId(turma.id)
    },
  })

  const alunosQuery = useQuery({
    queryKey: ['turmas', turmaSelecionadaId, 'alunos'],
    queryFn: () => turmaApi.listarAlunos(turmaSelecionadaId!),
    enabled: turmaSelecionadaId !== null,
  })

  const aggregateQuery = useQuery({
    queryKey: ['reko', 'aggregate', turmaSelecionadaId],
    queryFn: () => rekoApi.agregadoDaTurma(turmaSelecionadaId!),
    enabled: turmaSelecionadaId !== null,
  })

  const turmaSelecionada = turmasQuery.data?.find((t) => t.id === turmaSelecionadaId) ?? null

  function copiarCodigo(codigo: string) {
    navigator.clipboard?.writeText(codigo).then(() => {
      setCodigoCopiado(true)
      setTimeout(() => setCodigoCopiado(false), 1800)
    })
  }

  return (
    <AppShell largura="lg">
      <h1 className="mb-1 text-2xl font-bold text-text">Bem-vindo, {usuario?.nome.split(' ')[0]}!</h1>
      <p className="mb-6 text-sm text-text-soft">
        Cada turma é uma ilha — crie uma, compartilhe o código com os alunos, e acompanhe como eles estão.
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        {/* Coluna das turmas */}
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-secondary">Criar turma</h2>
            <form
              className="flex flex-col gap-2.5"
              onSubmit={(e) => {
                e.preventDefault()
                if (nomeNovaTurma.trim()) criarTurma.mutate(nomeNovaTurma.trim())
              }}
            >
              <input
                type="text"
                value={nomeNovaTurma}
                onChange={(e) => setNomeNovaTurma(e.target.value)}
                placeholder="ex: 6º Ano B"
                className="rounded-xl border border-border bg-[#fffaf3] px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
              <Button type="submit" disabled={criarTurma.isPending || !nomeNovaTurma.trim()}>
                {criarTurma.isPending ? 'Criando...' : '🏝️ Criar ilha'}
              </Button>
            </form>
          </Card>

          {turmasQuery.isLoading && <Spinner rotulo="Carregando turmas..." />}

          {turmasQuery.data && turmasQuery.data.length === 0 && (
            <p className="px-1 text-sm text-text-soft">Você ainda não criou nenhuma turma.</p>
          )}

          <div className="flex flex-col gap-2">
            {turmasQuery.data?.map((turma) => (
              <button
                key={turma.id}
                type="button"
                onClick={() => setTurmaSelecionadaId(turma.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                  turma.id === turmaSelecionadaId
                    ? 'border-accent bg-accent-soft'
                    : 'border-border bg-card hover:border-accent'
                }`}
              >
                <p className="text-sm font-bold text-text">{turma.nome}</p>
                <p className="text-xs text-text-soft">Código: {turma.codigo}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Coluna de detalhe da turma selecionada */}
        <div className="flex flex-col gap-5">
          {!turmaSelecionada && !turmasQuery.isLoading && (
            <Card className="p-6">
              <p className="text-sm text-text-soft">Crie ou escolha uma turma pra ver os alunos.</p>
            </Card>
          )}

          {turmaSelecionada && (
            <>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-secondary">Código de convite</p>
                  <p className="text-2xl font-bold tracking-widest text-text">{turmaSelecionada.codigo}</p>
                </div>
                <Button variante="outline" onClick={() => copiarCodigo(turmaSelecionada.codigo)}>
                  {codigoCopiado ? 'Copiado ✓' : 'Copiar código'}
                </Button>
              </Card>

              <Card className="p-5">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-secondary">
                  Alunos em {turmaSelecionada.nome}
                </h2>

                {alunosQuery.isLoading && <Spinner rotulo="Carregando alunos..." />}

                {alunosQuery.data && alunosQuery.data.length === 0 && (
                  <p className="text-sm text-text-soft">
                    Ninguém entrou ainda — compartilhe o código {turmaSelecionada.codigo} com a turma.
                  </p>
                )}

                <div className="flex flex-col gap-3">
                  {alunosQuery.data?.map((aluno) => {
                    const sinal = SINAL_INFO[aluno.sinal_bem_estar]
                    return (
                      <div key={aluno.id} className="rounded-2xl border border-border bg-[#fffaf3] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-bold text-text">{aluno.nome}</p>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${sinal.classe}`}
                          >
                            {sinal.emoji} {sinal.rotulo}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-text-soft">{aluno.frase_bem_estar}</p>

                        {aluno.temas_pesquisados.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {aluno.temas_pesquisados.map((tema) => (
                              <span
                                key={tema}
                                className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-text"
                              >
                                {tema}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-secondary">Reko da turma</h2>
                <p className="mb-4 text-xs text-text-soft">
                  Sempre agregado — nunca a nota de um aluno específico.
                </p>

                {aggregateQuery.isLoading && <Spinner rotulo="Calculando agregado..." />}

                {aggregateQuery.isError && (
                  <ErrorMessage
                    mensagem={
                      aggregateQuery.error instanceof ApiError
                        ? aggregateQuery.error.message
                        : 'Não foi possível carregar o agregado.'
                    }
                    aoTentarNovamente={() => aggregateQuery.refetch()}
                  />
                )}

                {aggregateQuery.data && !aggregateQuery.data.dados_suficientes && (
                  <p className="text-sm text-text-soft">
                    Essa turma tem {aggregateQuery.data.total_checkins} check-in(s) — abaixo do mínimo de{' '}
                    {aggregateQuery.data.minimo_necessario} pra mostrar uma média (protege a identidade de
                    quem respondeu).
                  </p>
                )}

                {aggregateQuery.data?.dados_suficientes && aggregateQuery.data.medias && (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-bold text-text-soft">
                      {aggregateQuery.data.total_checkins} check-ins nesta turma
                    </p>
                    {(Object.keys(ROTULOS_COMPETENCIA) as (keyof RekoMedias)[]).map((chave) => {
                      const media = aggregateQuery.data!.medias![chave]
                      return (
                        <div key={chave} className="flex items-center gap-3">
                          <span className="w-40 flex-none text-sm font-semibold text-text">
                            {ROTULOS_COMPETENCIA[chave]}
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent-soft">
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${(media / 5) * 100}%` }}
                            />
                          </div>
                          <span className="w-10 flex-none text-right text-sm font-bold text-text">
                            {media.toFixed(1)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}

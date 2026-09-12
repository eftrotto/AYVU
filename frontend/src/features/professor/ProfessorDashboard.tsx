import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { ApiError, rekoApi } from '../../lib/apiClient'
import { useAuth } from '../auth/AuthContext'
import type { RekoMedias } from '../../types/api'

const ROTULOS_COMPETENCIA: Record<keyof RekoMedias, string> = {
  autoconhecimento: 'Autoconhecimento',
  autogestao: 'Autogestão',
  consciencia_social: 'Consciência social',
  relacionamento: 'Relacionamento',
  decisao_responsavel: 'Decisão responsável',
}

export function ProfessorDashboard() {
  const { usuario } = useAuth()
  const [turmaId, setTurmaId] = useState<string>(usuario?.turma_id ? String(usuario.turma_id) : '')
  const [turmaConsultada, setTurmaConsultada] = useState<number | null>(
    usuario?.turma_id ?? null,
  )

  const aggregateQuery = useQuery({
    queryKey: ['reko', 'aggregate', turmaConsultada],
    queryFn: () => rekoApi.agregadoDaTurma(turmaConsultada!),
    enabled: turmaConsultada !== null,
  })

  return (
    <AppShell largura="md">
      <h1 className="mb-1 text-2xl font-bold text-text">Bem-vindo, {usuario?.nome.split(' ')[0]}!</h1>
      <p className="mb-6 text-sm text-text-soft">
        Reko da turma — sempre agregado, nunca o detalhe de um aluno específico.
      </p>

      <Card className="mb-6 p-6">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            const numero = Number(turmaId)
            if (!Number.isNaN(numero)) setTurmaConsultada(numero)
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm font-bold text-text">
            Turma
            <input
              type="number"
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
              placeholder="ex: 1"
              className="w-32 rounded-xl border border-border bg-[#fffaf3] px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-dark"
          >
            Ver agregado
          </button>
        </form>
      </Card>

      {turmaConsultada === null && (
        <p className="text-sm text-text-soft">Informe uma turma pra ver a média do Reko.</p>
      )}

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
        <Card className="p-6">
          <p className="text-sm text-text-soft">
            Essa turma tem {aggregateQuery.data.total_checkins} check-in(s) — abaixo do mínimo de{' '}
            {aggregateQuery.data.minimo_necessario} pra mostrar uma média (protege a identidade de quem
            respondeu).
          </p>
        </Card>
      )}

      {aggregateQuery.data?.dados_suficientes && aggregateQuery.data.medias && (
        <Card className="p-6">
          <p className="mb-4 text-xs font-bold tracking-wide text-secondary uppercase">
            {aggregateQuery.data.total_checkins} check-ins nesta turma
          </p>
          <div className="flex flex-col gap-3">
            {(Object.keys(ROTULOS_COMPETENCIA) as (keyof RekoMedias)[]).map((chave) => {
              const media = aggregateQuery.data!.medias![chave]
              return (
                <div key={chave} className="flex items-center gap-3">
                  <span className="w-40 flex-none text-sm font-semibold text-text">
                    {ROTULOS_COMPETENCIA[chave]}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent-soft">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(media / 5) * 100}%` }} />
                  </div>
                  <span className="w-10 flex-none text-right text-sm font-bold text-text">
                    {media.toFixed(1)}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </AppShell>
  )
}

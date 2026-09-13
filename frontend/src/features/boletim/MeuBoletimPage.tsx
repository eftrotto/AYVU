import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { ApiError, notaApi } from '../../lib/apiClient'

function corDaNota(nota: number): string {
  if (nota < 5) return 'text-erro'
  if (nota < 7) return 'text-[#8a6d1f]'
  return 'text-secondary'
}

export function MeuBoletimPage() {
  const navigate = useNavigate()
  const notasQuery = useQuery({ queryKey: ['notas', 'minhas'], queryFn: notaApi.minhas })

  return (
    <AppShell largura="md" voltar={{ rotulo: 'Voltar pro Ayvu', aoClicar: () => navigate('/aluno/ayvu') }}>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text">Meu boletim</h1>
        <p className="text-sm text-text-soft">As notas que o seu professor lançou.</p>
      </header>

      {notasQuery.isLoading && <Spinner rotulo="Carregando boletim..." />}

      {notasQuery.isError && (
        <ErrorMessage
          mensagem={notasQuery.error instanceof ApiError ? notasQuery.error.message : 'Não foi possível carregar.'}
          aoTentarNovamente={() => notasQuery.refetch()}
        />
      )}

      {notasQuery.data && notasQuery.data.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-sm text-text-soft">Nenhuma nota lançada ainda.</p>
        </Card>
      )}

      <div className="flex flex-col gap-2.5">
        {notasQuery.data?.map((nota) => (
          <Card key={nota.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-bold text-text">{nota.disciplina}</p>
              <p className="text-xs text-text-soft">
                {nota.prova} · {new Date(nota.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
              </p>
            </div>
            <span className={`text-xl font-bold ${corDaNota(nota.nota)}`}>{nota.nota.toFixed(1)}</span>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}

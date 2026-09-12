import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Spinner } from '../../components/ui/Spinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { ApiError } from '../../lib/apiClient'
import { useProgresso, useTemas } from './hooks'
import { TemaCard } from './TemaCard'

export function AyvuHomePage() {
  const navigate = useNavigate()
  const temas = useTemas()
  const progresso = useProgresso()

  return (
    <AppShell voltar={{ rotulo: 'Início', aoClicar: () => navigate('/aluno') }}>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text">Ayvu — o que te move</h1>
        <p className="text-sm text-text-soft">
          Escolha um tema, explore no seu ritmo. Sem ranking, sem prova, sem pressa.
        </p>
      </header>

      {temas.isLoading && <Spinner rotulo="Carregando temas..." />}

      {temas.isError && (
        <ErrorMessage
          mensagem={temas.error instanceof ApiError ? temas.error.message : 'Não foi possível carregar os temas.'}
          aoTentarNovamente={() => temas.refetch()}
        />
      )}

      {temas.data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {temas.data.map((tema, indice) => {
            const concluidos = progresso.data?.itens.filter((i) => i.tema_id === tema.id && i.concluido).length ?? 0
            return <TemaCard key={tema.id} tema={tema} concluidos={concluidos} indice={indice} />
          })}
        </div>
      )}
    </AppShell>
  )
}

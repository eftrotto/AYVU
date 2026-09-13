import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { ApiError, okaApi } from '../../lib/apiClient'
import { AvatarStage } from '../macu/AvatarStage'
import { AVATAR_PADRAO } from '../macu/lpcData'
import { ChatDaOka } from './ChatDaOka'
import { useAuth } from '../auth/AuthContext'

/**
 * Oka — quem mais está na mesma Oka. De propósito só mostra nome + Macu de
 * cada colega, nada do que só o professor pode ver (sinal de bem-estar,
 * temas pesquisados) — ver ColegaDaOkaOut no backend.
 */
export function OkaPage() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const colegasQuery = useQuery({ queryKey: ['okas', 'minha', 'colegas'], queryFn: okaApi.listarColegas })

  return (
    <AppShell largura="md" voltar={{ rotulo: 'Voltar pro Ayvu', aoClicar: () => navigate('/aluno/ayvu') }}>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text">Oka</h1>
        <p className="text-sm text-text-soft">Quem mais está na sua Oka.</p>
      </header>

      {colegasQuery.isLoading && <Spinner rotulo="Carregando colegas..." />}

      {colegasQuery.isError && (
        <ErrorMessage
          mensagem={
            colegasQuery.error instanceof ApiError ? colegasQuery.error.message : 'Não foi possível carregar.'
          }
          aoTentarNovamente={() => colegasQuery.refetch()}
        />
      )}

      {colegasQuery.data && colegasQuery.data.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-sm text-text-soft">
            Ninguém mais por aqui ainda — ou você ainda não entrou numa Oka (peça o código pro seu
            professor, no botão "Entrar numa Oka" da Lagoa).
          </p>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {colegasQuery.data?.map((colega) => (
          <Card key={colega.id} className="flex flex-col items-center gap-2 p-4">
            <AvatarStage config={{ ...AVATAR_PADRAO, ...colega.avatar_config }} tamanho={80} comMoldura={false} />
            <p className="text-center text-sm font-semibold text-text">{colega.nome}</p>
          </Card>
        ))}
      </div>

      {usuario?.oka_id != null && <ChatDaOka />}
    </AppShell>
  )
}

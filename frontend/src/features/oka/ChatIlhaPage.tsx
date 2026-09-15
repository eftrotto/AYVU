import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { ChatDaOka } from './ChatDaOka'

export function ChatIlhaPage() {
  const navigate = useNavigate()

  return (
    <AppShell largura="md" voltar={{ rotulo: 'Voltar pro Ayvu', aoClicar: () => navigate('/aluno/ayvu') }}>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text">Chat da ilha</h1>
        <p className="text-sm text-text-soft">Converse com os colegas da sua ilha.</p>
      </header>

      <ChatDaOka />
    </AppShell>
  )
}

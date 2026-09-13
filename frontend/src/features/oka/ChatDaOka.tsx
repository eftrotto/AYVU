import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { chatApi } from '../../lib/apiClient'
import { useAuth } from '../auth/AuthContext'

function horario(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Polling em vez de websocket: simples o bastante pro volume de um MVP.
export function ChatDaOka() {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const [texto, setTexto] = useState('')
  const fimDaListaRef = useRef<HTMLDivElement>(null)

  const mensagensQuery = useQuery({
    queryKey: ['okas', 'minha', 'chat'],
    queryFn: chatApi.listarMinha,
    refetchInterval: 4000,
  })

  const enviarMensagem = useMutation({
    mutationFn: (texto: string) => chatApi.enviar(texto),
    onSuccess: (mensagem) => {
      queryClient.setQueryData(['okas', 'minha', 'chat'], (atual: typeof mensagensQuery.data) => [
        ...(atual ?? []),
        mensagem,
      ])
      setTexto('')
    },
  })

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ block: 'end' })
  }, [mensagensQuery.data])

  return (
    <Card className="flex flex-col p-5">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-secondary">💬 Chat da Oka</h2>

      <div className="mb-3 flex h-72 flex-col gap-2 overflow-y-auto rounded-xl border border-border bg-[#fffaf3] p-3">
        {mensagensQuery.isLoading && <Spinner rotulo="Carregando chat..." />}

        {mensagensQuery.data && mensagensQuery.data.length === 0 && (
          <p className="m-auto text-center text-sm text-text-soft">
            Ninguém mandou mensagem ainda. Que tal começar a conversa?
          </p>
        )}

        {mensagensQuery.data?.map((mensagem) => {
          const ehMinha = mensagem.autor_id === usuario?.id
          return (
            <div key={mensagem.id} className={`flex flex-col ${ehMinha ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  ehMinha ? 'bg-accent text-white' : 'border border-border bg-card text-text'
                }`}
              >
                {!ehMinha && <p className="mb-0.5 text-xs font-bold text-secondary">{mensagem.autor_nome}</p>}
                <p className="break-words">{mensagem.texto}</p>
              </div>
              <span className="mt-0.5 text-[10px] text-text-soft">{horario(mensagem.criado_em)}</span>
            </div>
          )
        })}
        <div ref={fimDaListaRef} />
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const valor = texto.trim()
          if (valor) enviarMensagem.mutate(valor)
        }}
      >
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva algo pra Oka..."
          maxLength={1000}
          className="min-w-0 flex-1 rounded-xl border border-border bg-[#fffaf3] px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
        <Button type="submit" disabled={enviarMensagem.isPending || !texto.trim()}>
          Enviar
        </Button>
      </form>
    </Card>
  )
}

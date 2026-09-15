import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { ApiError, macuApi, ocaPessoalApi } from '../../lib/apiClient'
import type { OkaPessoal } from '../../types/api'
import { AvatarStage } from '../macu/AvatarStage'
import { AVATAR_PADRAO } from '../macu/lpcData'
import { SwatchRow } from '../macu/SwatchRow'
import { COR_TELHADO, CORES_CHAO, CORES_PAREDE, ITENS_CENTRAIS, type ItemCentral } from './ocaData'

const PADRAO: OkaPessoal = { cor_parede: 'c2a35f', cor_chao: '7a5636', item_central: 'nenhum', atualizado_em: '' }

/**
 * Oka — o espaço pessoal do aluno pra decorar (referência à oca indígena,
 * inspirado no iglu do Club Penguin). Protótipo: só decoração de ambiente,
 * sem sistema de itens desbloqueáveis ainda.
 */
export function OkaPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const ocaQuery = useQuery({ queryKey: ['oca'], queryFn: ocaPessoalApi.obter })
  const avatarQuery = useQuery({ queryKey: ['macu', 'avatar'], queryFn: macuApi.obterAvatar })
  const config = { ...AVATAR_PADRAO, ...avatarQuery.data?.avatar_config }

  const [decoracao, setDecoracao] = useState<OkaPessoal>(PADRAO)
  const [feedback, setFeedback] = useState<{ texto: string; sucesso: boolean } | null>(null)
  const hidratado = useRef(false)

  useEffect(() => {
    if (ocaQuery.data && !hidratado.current) {
      hidratado.current = true
      setDecoracao(ocaQuery.data)
    }
  }, [ocaQuery.data])

  const salvar = useMutation({
    mutationFn: () => ocaPessoalApi.salvar(decoracao),
    onSuccess: (dados) => {
      queryClient.setQueryData(['oca'], dados)
      setFeedback({ texto: 'Oka salva ✓', sucesso: true })
      setTimeout(() => setFeedback(null), 2500)
    },
    onError: (erro) => {
      setFeedback({
        texto: erro instanceof ApiError ? erro.message : 'Não foi possível salvar agora.',
        sucesso: false,
      })
    },
  })

  function atualizar<K extends keyof OkaPessoal>(campo: K, valor: OkaPessoal[K]) {
    setDecoracao((atual) => ({ ...atual, [campo]: valor }))
    setFeedback(null)
  }

  const itemInfo = ITENS_CENTRAIS.find((i) => i.valor === decoracao.item_central) ?? ITENS_CENTRAIS[0]

  return (
    <AppShell largura="md" voltar={{ rotulo: 'Voltar pro Ayvu', aoClicar: () => navigate('/aluno/ayvu') }}>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text">Oka</h1>
        <p className="text-sm text-text-soft">Seu espaço pessoal — só você vê e decora.</p>
      </header>

      {ocaQuery.isLoading ? (
        <Spinner rotulo="Carregando sua Oka..." />
      ) : (
        <div className="flex flex-col gap-5">
          <Card className="flex flex-col items-center gap-4 p-6">
            <div className="relative mx-auto" style={{ width: 300 }}>
              <div
                className="mx-auto"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '150px solid transparent',
                  borderRight: '150px solid transparent',
                  borderBottom: `100px solid #${COR_TELHADO}`,
                }}
              />
              <div
                className="relative overflow-hidden rounded-b-2xl shadow-warm"
                style={{ height: 190, backgroundColor: `#${decoracao.cor_parede}` }}
              >
                <div
                  className="absolute inset-x-0 bottom-0"
                  style={{ height: 56, backgroundColor: `#${decoracao.cor_chao}` }}
                />
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-full"
                  style={{ width: 62, height: 110, backgroundColor: '#2a2015' }}
                />
                {itemInfo.emoji && (
                  <span className="absolute bottom-3 left-[22%] text-3xl" aria-hidden>
                    {itemInfo.emoji}
                  </span>
                )}
                <div className="absolute bottom-0 right-[14%]">
                  <AvatarStage config={config} tamanho={104} comMoldura={false} />
                </div>
              </div>
            </div>

            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending} className="w-full max-w-xs">
              {salvar.isPending ? 'Salvando...' : 'Salvar minha Oka'}
            </Button>
            {feedback && (
              <p className={`text-sm font-semibold ${feedback.sucesso ? 'text-certo' : 'text-erro'}`}>
                {feedback.texto}
              </p>
            )}
          </Card>

          <Card className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-3 first:border-0 first:pt-0">
              <h2 className="text-xs font-bold uppercase tracking-wide text-secondary">Parede</h2>
              <SwatchRow
                opcoes={CORES_PAREDE}
                valorSelecionado={decoracao.cor_parede}
                aoSelecionar={(v) => atualizar('cor_parede', v)}
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-secondary">Chão</h2>
              <SwatchRow
                opcoes={CORES_CHAO}
                valorSelecionado={decoracao.cor_chao}
                aoSelecionar={(v) => atualizar('cor_chao', v)}
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-secondary">Item central</h2>
              <div className="flex flex-wrap gap-2">
                {ITENS_CENTRAIS.map((item) => (
                  <button
                    key={item.valor}
                    type="button"
                    onClick={() => atualizar('item_central', item.valor as ItemCentral)}
                    className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
                      decoracao.item_central === item.valor
                        ? 'border-accent bg-accent-soft text-text'
                        : 'border-border bg-[#fffaf3] text-text-soft hover:border-accent'
                    }`}
                  >
                    {item.emoji ? `${item.emoji} ` : ''}
                    {item.rotulo}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  )
}

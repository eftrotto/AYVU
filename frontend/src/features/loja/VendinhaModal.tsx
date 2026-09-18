import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, lojaApi, macuApi, ocaPessoalApi } from '../../lib/apiClient'
import { AVATAR_PADRAO, CORES_DE_ROUPA } from '../macu/lpcData'
import { CORES_CHAO, CORES_PAREDE, ITENS_CENTRAIS } from '../oka/ocaData'
import type { ItemLoja, MacuAvatarConfig, OkaPessoal } from '../../types/api'

interface VendinhaModalProps {
  aberta: boolean
  aoFechar: () => void
}

const PADRAO_OCA: OkaPessoal = { cor_parede: 'c2a35f', cor_chao: '7a5636', item_central: 'nenhum', atualizado_em: '' }

const ROTULO_CAMPO: Record<string, string> = {
  shirtColor: 'Camisa',
  pantsColor: 'Calça',
  shoeColor: 'Sapato',
  usaOculos: 'Acessório',
  cor_parede: 'Parede',
  cor_chao: 'Chão',
  item_central: 'Item central',
}

// Preview visual do item (cor ou emoji) — reaproveita os MESMOS catálogos do
// frontend que routers/loja.py espelhou no backend, então não precisa
// duplicar hex/emoji aqui.
function previewDoItem(item: ItemLoja): { cor?: string; emoji?: string } {
  if (item.campo === 'usaOculos') return { emoji: '🕶️' }
  if (item.campo === 'shirtColor' || item.campo === 'pantsColor' || item.campo === 'shoeColor') {
    return { cor: CORES_DE_ROUPA.find((c) => c.valor === item.valor)?.hex }
  }
  if (item.campo === 'cor_parede') return { cor: CORES_PAREDE.find((c) => c.valor === item.valor)?.hex }
  if (item.campo === 'cor_chao') return { cor: CORES_CHAO.find((c) => c.valor === item.valor)?.hex }
  if (item.campo === 'item_central') return { emoji: ITENS_CENTRAIS.find((i) => i.valor === item.valor)?.emoji ?? undefined }
  return {}
}

function itemEstaEquipado(item: ItemLoja, config: MacuAvatarConfig, oca: OkaPessoal): boolean {
  if (item.tipo === 'macu') {
    if (item.campo === 'usaOculos') return Boolean(config.usaOculos) === (item.valor === 'true')
    return config[item.campo as keyof MacuAvatarConfig] === item.valor
  }
  return oca[item.campo as keyof OkaPessoal] === item.valor
}

/**
 * Vendinha — lojinha na ilha do aluno (ver Vendinha.tsx pro objeto
 * clicável na cena). Vende acesso a opções de customização do Macu e da
 * Oka pessoal que já existem nos catálogos (lpcData.ts/ocaData.ts), mas só
 * ficam liberadas depois de compradas (ver routers/loja.py). Comprar já
 * equipa na hora — não existe um passo separado de "equipar".
 */
export function VendinhaModal({ aberta, aoFechar }: VendinhaModalProps) {
  const queryClient = useQueryClient()
  const [aba, setAba] = useState<'macu' | 'oka'>('macu')
  const [itemPendente, setItemPendente] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const itasQuery = useQuery({ queryKey: ['macu', 'itas'], queryFn: macuApi.obterItas, enabled: aberta })
  const avatarQuery = useQuery({ queryKey: ['macu', 'avatar'], queryFn: macuApi.obterAvatar, enabled: aberta })
  const ocaQuery = useQuery({ queryKey: ['oca'], queryFn: ocaPessoalApi.obter, enabled: aberta })
  const itensQuery = useQuery({ queryKey: ['loja', 'itens'], queryFn: lojaApi.listarItens, enabled: aberta })
  const comprasQuery = useQuery({ queryKey: ['loja', 'minhas-compras'], queryFn: lojaApi.minhasCompras, enabled: aberta })

  const config: MacuAvatarConfig = { ...AVATAR_PADRAO, ...avatarQuery.data?.avatar_config }
  const decoracao: OkaPessoal = ocaQuery.data ?? PADRAO_OCA
  const comprados = new Set(comprasQuery.data ?? [])

  const equipar = useMutation({
    mutationFn: async (item: ItemLoja): Promise<void> => {
      if (item.tipo === 'macu') {
        const valor = item.campo === 'usaOculos' ? item.valor === 'true' : item.valor
        const avatar = await macuApi.salvarAvatar({ ...avatarQuery.data?.avatar_config, [item.campo]: valor })
        queryClient.setQueryData(['macu', 'avatar'], avatar)
      } else {
        const oca = await ocaPessoalApi.salvar({ ...decoracao, [item.campo]: item.valor })
        queryClient.setQueryData(['oca'], oca)
      }
    },
  })

  const comprar = useMutation({
    mutationFn: (item: ItemLoja) => lojaApi.comprar(item.id),
    onMutate: (item) => {
      setErro(null)
      setItemPendente(item.id)
    },
    onSuccess: async (_dados, item) => {
      await queryClient.invalidateQueries({ queryKey: ['macu', 'itas'] })
      await queryClient.invalidateQueries({ queryKey: ['loja', 'minhas-compras'] })
      await equipar.mutateAsync(item)
    },
    onError: (erroCapturado) => {
      setErro(erroCapturado instanceof ApiError ? erroCapturado.message : 'Não foi possível comprar esse item.')
    },
    onSettled: () => setItemPendente(null),
  })

  const itensDaAba = (itensQuery.data ?? []).filter((item) => item.tipo === aba)

  return (
    <AnimatePresence>
      {aberta && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={aoFechar}
        >
          <motion.div
            className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl border border-border bg-card p-5 shadow-warm"
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-secondary">🏪 Vendinha</p>
                <h2 className="text-xl font-bold text-text">Personalize seu Macu e sua Oka</h2>
              </div>
              <span className="flex-none rounded-full bg-accent-soft px-3 py-1.5 text-sm font-bold tabular-nums text-accent">
                🪙 {itasQuery.data?.itas_total ?? '...'}
              </span>
            </div>

            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setAba('macu')}
                className={`flex-1 rounded-full px-3 py-1.5 text-sm font-bold transition-colors ${
                  aba === 'macu' ? 'bg-accent text-white' : 'bg-accent-soft text-text-soft hover:bg-accent-soft/70'
                }`}
              >
                👕 Roupas
              </button>
              <button
                type="button"
                onClick={() => setAba('oka')}
                className={`flex-1 rounded-full px-3 py-1.5 text-sm font-bold transition-colors ${
                  aba === 'oka' ? 'bg-accent text-white' : 'bg-accent-soft text-text-soft hover:bg-accent-soft/70'
                }`}
              >
                🏠 Oka
              </button>
            </div>

            {erro && <p className="mb-2 text-xs font-semibold text-erro">{erro}</p>}

            <div className="grid flex-1 grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3">
              {itensDaAba.map((item) => {
                const preview = previewDoItem(item)
                const possuido = comprados.has(item.id)
                const equipado = itemEstaEquipado(item, config, decoracao)
                const pendente = itemPendente === item.id && (comprar.isPending || equipar.isPending)

                return (
                  <div
                    key={item.id}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-[#fffaf3] p-2.5"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wide text-text-soft">
                      {ROTULO_CAMPO[item.campo] ?? item.campo}
                    </span>
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-[0_0_0_1.5px_var(--color-border)]"
                      style={preview.cor ? { backgroundColor: `#${preview.cor}` } : undefined}
                    >
                      {preview.emoji && <span className="text-lg">{preview.emoji}</span>}
                    </div>
                    <span className="text-center text-xs font-semibold text-text">{item.rotulo}</span>

                    {equipado ? (
                      <span className="w-full rounded-full bg-secondary-soft px-2 py-1 text-center text-xs font-bold text-certo">
                        ✓ Equipado
                      </span>
                    ) : possuido ? (
                      <button
                        type="button"
                        disabled={pendente}
                        onClick={() => equipar.mutate(item)}
                        className="w-full rounded-full bg-accent px-2 py-1 text-xs font-bold text-white hover:bg-accent-dark disabled:opacity-60"
                      >
                        {pendente ? '...' : 'Usar'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={pendente}
                        onClick={() => comprar.mutate(item)}
                        className="w-full rounded-full bg-secondary px-2 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-60"
                      >
                        {pendente ? '...' : `🪙 ${item.preco}`}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={aoFechar}
              className="mt-3 rounded-full border border-border px-4 py-2 text-sm font-bold text-text-soft hover:bg-accent-soft/50"
            >
              Fechar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

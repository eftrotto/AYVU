import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { ApiError, macuApi } from '../../lib/apiClient'
import type { MacuAvatarConfig } from '../../types/api'
import { AvatarStage } from './AvatarStage'
import { SwatchRow } from './SwatchRow'
import {
  AVATAR_PADRAO,
  CORES_DE_CABELO,
  CORES_DE_OLHO,
  CORES_DE_ROUPA,
  ESTILOS_DE_CABELO,
  ESTILOS_DE_SOBRANCELHA,
  GENEROS,
  TONS_DE_PELE,
} from './lpcData'

function sortear<T extends { valor: string }>(lista: readonly T[]): string {
  return lista[Math.floor(Math.random() * lista.length)].valor
}

export function MacuPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const avatarQuery = useQuery({ queryKey: ['macu', 'avatar'], queryFn: macuApi.obterAvatar })
  const [config, setConfig] = useState<MacuAvatarConfig>(AVATAR_PADRAO)
  const [feedback, setFeedback] = useState<{ texto: string; sucesso: boolean } | null>(null)
  const hidratado = useRef(false)

  useEffect(() => {
    if (avatarQuery.data && !hidratado.current) {
      hidratado.current = true
      setConfig({ ...AVATAR_PADRAO, ...avatarQuery.data.avatar_config })
    }
  }, [avatarQuery.data])

  const salvar = useMutation({
    mutationFn: () => macuApi.salvarAvatar(config),
    onSuccess: (dados) => {
      queryClient.setQueryData(['macu', 'avatar'], dados)
      setFeedback({ texto: 'Macu salvo ✓', sucesso: true })
      setTimeout(() => setFeedback(null), 2500)
    },
    onError: (erro) => {
      setFeedback({
        texto: erro instanceof ApiError ? erro.message : 'Não foi possível salvar agora.',
        sucesso: false,
      })
    },
  })

  function atualizar<K extends keyof MacuAvatarConfig>(campo: K, valor: MacuAvatarConfig[K]) {
    setConfig((atual) => ({ ...atual, [campo]: valor }))
    setFeedback(null)
  }

  function sortearLook() {
    setConfig({
      gender: sortear(GENEROS) as MacuAvatarConfig['gender'],
      skinTone: sortear(TONS_DE_PELE),
      hairStyle: sortear(ESTILOS_DE_CABELO),
      hairColor: sortear(CORES_DE_CABELO),
      eyebrowStyle: sortear(ESTILOS_DE_SOBRANCELHA),
      eyeColor: sortear(CORES_DE_OLHO),
      shirtColor: sortear(CORES_DE_ROUPA),
      pantsColor: sortear(CORES_DE_ROUPA),
      shoeColor: sortear(CORES_DE_ROUPA),
    })
    setFeedback(null)
  }

  return (
    <AppShell voltar={{ rotulo: 'Voltar pro Ayvu', aoClicar: () => navigate('/aluno/ayvu') }}>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text">Macu — como você se expressa</h1>
        <p className="text-sm text-text-soft">
          Monte um avatar da cabeça aos pés que seja a sua cara. Ele é só seu.
        </p>
      </header>

      {avatarQuery.isLoading && <Spinner rotulo="Carregando seu Macu..." />}

      {avatarQuery.isError && (
        <ErrorMessage
          mensagem="Não foi possível carregar seu Macu salvo. Você ainda pode montar um novo abaixo."
        />
      )}

      {!avatarQuery.isLoading && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-7 shadow-warm">
            <AvatarStage config={config} />

            <Button variante="ghost" onClick={sortearLook} className="w-full">
              🎲 Sortear um look
            </Button>
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending} className="w-full">
              {salvar.isPending ? 'Salvando...' : 'Salvar meu Macu'}
            </Button>
            {feedback && (
              <p className={`text-sm font-semibold ${feedback.sucesso ? 'text-certo' : 'text-erro'}`}>
                {feedback.texto}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-7 shadow-warm">
            <Grupo titulo="Corpo">
              <Campo rotulo="Sexo">
                <div className="flex gap-2">
                  {GENEROS.map((genero) => (
                    <button
                      key={genero.valor}
                      type="button"
                      title={genero.rotulo}
                      onClick={() => atualizar('gender', genero.valor as MacuAvatarConfig['gender'])}
                      className={`flex h-14 w-14 items-center justify-center rounded-xl border text-2xl font-bold transition-colors ${
                        config.gender === genero.valor
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-border bg-[#fffaf3] text-text-soft hover:border-accent'
                      }`}
                    >
                      {genero.simbolo}
                    </button>
                  ))}
                </div>
              </Campo>
              <Campo rotulo="Tom de pele">
                <SwatchRow opcoes={TONS_DE_PELE} valorSelecionado={config.skinTone} aoSelecionar={(v) => atualizar('skinTone', v)} />
              </Campo>
            </Grupo>

            <Grupo titulo="Cabelo">
              <Campo rotulo="Estilo">
                <Select
                  opcoes={ESTILOS_DE_CABELO}
                  valor={config.hairStyle}
                  aoMudar={(v) => atualizar('hairStyle', v)}
                />
              </Campo>
              <Campo rotulo="Cor">
                <SwatchRow opcoes={CORES_DE_CABELO} valorSelecionado={config.hairColor} aoSelecionar={(v) => atualizar('hairColor', v)} />
              </Campo>
            </Grupo>

            <Grupo titulo="Rosto">
              <Campo rotulo="Sobrancelha">
                <Select
                  opcoes={ESTILOS_DE_SOBRANCELHA}
                  valor={config.eyebrowStyle}
                  aoMudar={(v) => atualizar('eyebrowStyle', v)}
                />
              </Campo>
              <Campo rotulo="Cor dos olhos">
                <SwatchRow opcoes={CORES_DE_OLHO} valorSelecionado={config.eyeColor} aoSelecionar={(v) => atualizar('eyeColor', v)} />
              </Campo>
            </Grupo>

            <Grupo titulo="Roupas">
              <Campo rotulo="Camisa">
                <SwatchRow opcoes={CORES_DE_ROUPA} valorSelecionado={config.shirtColor} aoSelecionar={(v) => atualizar('shirtColor', v)} />
              </Campo>
              <Campo rotulo="Calça">
                <SwatchRow opcoes={CORES_DE_ROUPA} valorSelecionado={config.pantsColor} aoSelecionar={(v) => atualizar('pantsColor', v)} />
              </Campo>
              <Campo rotulo="Sapato">
                <SwatchRow opcoes={CORES_DE_ROUPA} valorSelecionado={config.shoeColor} aoSelecionar={(v) => atualizar('shoeColor', v)} />
              </Campo>
            </Grupo>
          </div>
        </div>
      )}
    </AppShell>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-5 first:border-0 first:pt-0">
      <h2 className="text-xs font-bold tracking-wide text-secondary uppercase">{titulo}</h2>
      {children}
    </div>
  )
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-text">{rotulo}</label>
      {children}
    </div>
  )
}

function Select({
  opcoes,
  valor,
  aoMudar,
}: {
  opcoes: readonly { valor: string; rotulo: string }[]
  valor: string
  aoMudar: (v: string) => void
}) {
  return (
    <select
      value={valor}
      onChange={(e) => aoMudar(e.target.value)}
      className="rounded-xl border border-border bg-[#fffaf3] px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent"
    >
      {opcoes.map((opcao) => (
        <option key={opcao.valor} value={opcao.valor}>
          {opcao.rotulo}
        </option>
      ))}
    </select>
  )
}

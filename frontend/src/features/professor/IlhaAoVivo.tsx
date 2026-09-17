import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { macuApi, presencaApi } from '../../lib/apiClient'
import { useAuth } from '../auth/AuthContext'
import { MacuNaIlha, type MacuNaIlhaHandle } from '../ayvu/lagoa/MacuNaIlha'
import { AvatarStage } from '../macu/AvatarStage'
import { AVATAR_PADRAO, LPC_FRAME_ROW } from '../macu/lpcData'
import { PajeStage } from '../macu/PajeStage'
import type { MacuAvatarConfig } from '../../types/api'

interface IlhaAoVivoProps {
  okaId: number
}

interface Limites {
  cx: number
  cy: number
  rx: number
  ry: number
}

const RAIO_MACU = 20
const INTERVALO_POLLING_MS = 2000

/**
 * Visão ao vivo da ilha pro professor — a MESMA cena que o aluno vê (ver
 * LagoaCena.tsx), compacta, com os alunos atualmente presentes (via
 * polling, mesmo multiplayer da LagoaCena — ver MacuNaIlha.tsx e
 * models.PresencaIlha pro porquê de ser polling) e, agora, o próprio
 * boneco do professor também, clicável pra caminhar (fase de teste: sem
 * tela de customização, só 2 presets fixos — ver lpcData.ts).
 */
export function IlhaAoVivo({ okaId }: IlhaAoVivoProps) {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const ilhaRef = useRef<HTMLDivElement>(null)
  const gramaRef = useRef<HTMLDivElement>(null)
  const arvoreRef = useRef<HTMLDivElement>(null)
  const macuHandleRef = useRef<MacuNaIlhaHandle>(null)
  const limitesRef = useRef<Limites>({ cx: 0, cy: 0, rx: 0, ry: 0 })
  const [, forcarRender] = useState(0)

  useEffect(() => {
    function medir() {
      const ilha = ilhaRef.current
      const grama = gramaRef.current
      if (!ilha || !grama) return
      const ilhaRect = ilha.getBoundingClientRect()
      const gramaRect = grama.getBoundingClientRect()
      if (gramaRect.width < 20 || gramaRect.height < 20) return
      limitesRef.current = {
        cx: gramaRect.left - ilhaRect.left + gramaRect.width / 2,
        cy: gramaRect.top - ilhaRect.top + gramaRect.height / 2,
        rx: Math.max(gramaRect.width / 2 - RAIO_MACU, 8),
        ry: Math.max(gramaRect.height / 2 - RAIO_MACU, 8),
      }
      forcarRender((n) => n + 1)
    }

    medir()
    const ilha = ilhaRef.current
    if (!ilha || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', medir)
      return () => window.removeEventListener('resize', medir)
    }
    const observer = new ResizeObserver(medir)
    observer.observe(ilha)
    return () => observer.disconnect()
  }, [])

  const { data } = useQuery({
    queryKey: ['okas', okaId, 'presenca'],
    queryFn: () => presencaApi.listarDaOka(okaId),
    refetchInterval: INTERVALO_POLLING_MS,
  })

  const avatarProfessorQuery = useQuery({
    queryKey: ['macu', 'avatar-professor'],
    queryFn: macuApi.obterAvatarProfessor,
  })

  const escolherAvatar = useMutation({
    mutationFn: (genero: 'male' | 'female') =>
      macuApi.salvarAvatarProfessor({ gender: genero } satisfies Partial<MacuAvatarConfig>),
    onSuccess: (avatar) => queryClient.setQueryData(['macu', 'avatar-professor'], avatar),
  })

  const bonecoEscolhido =
    avatarProfessorQuery.data != null && Object.keys(avatarProfessorQuery.data.avatar_config).length > 0
  const generoProfessor: 'male' | 'female' = avatarProfessorQuery.data?.avatar_config.gender ?? 'male'

  // Filtra a própria presença da lista de "outros" — ela já é desenhada
  // separadamente abaixo pelo MacuNaIlha (interativo, controlado por esse
  // professor), então sem isso ele apareceria duas vezes na cena.
  const outrosJogadores = data?.filter((jogador) => jogador.user_id !== usuario?.id) ?? []

  const { cx, cy, rx, ry } = limitesRef.current

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl sm:h-80">
      <div
        ref={ilhaRef}
        className={`absolute inset-0 ${bonecoEscolhido ? 'cursor-pointer' : ''}`}
        onClick={(e) => {
          if (bonecoEscolhido) macuHandleRef.current?.moverPara(e.clientX, e.clientY)
        }}
      >
        <div className="absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-[#ffd9a8] via-[#f2a468] to-[#3c7681]" />
        <div className="absolute left-1/2 top-[30%] h-14 w-14 -translate-x-1/2 rounded-full bg-[#ffedc2] opacity-80 blur-[2px]" />
        <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-b from-[#4f8f92] via-[#215a63] to-[#0d2c34]">
          <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#ffd9a8]/40 to-transparent" />
        </div>

        <div className="absolute" style={{ left: '14%', top: '55%', width: '72%', height: '32%' }}>
          <div className="absolute inset-x-0 bottom-0 h-[62%] rounded-[50%] shadow-lg bg-gradient-to-b from-[#e3cd94] to-[#c2a35f]" />
          <div
            ref={gramaRef}
            className="absolute inset-x-[10%] top-0 h-[68%] rounded-[50%] bg-gradient-to-b from-[#5f9448] to-[#3f6c32]"
          />

          {/* Fogueira (pedras + gravetos cruzados, apagada — sem emoji de
              chama, mesma linguagem visual da Oka pessoal) no lugar do
              coqueiro. */}
          <div
            className="absolute z-[1]"
            style={{ left: '50%', top: '34%', width: 70, height: 36, transform: 'translate(-50%, -50%)' }}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 60,
                height: 30,
                background: 'radial-gradient(ellipse, rgba(255,140,40,0.35) 0%, rgba(255,90,20,0) 75%)',
                filter: 'blur(1px)',
              }}
            />
            {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((angulo) => {
              const rad = (angulo * Math.PI) / 180
              const x = 35 + Math.cos(rad) * 27
              const y = 20 + Math.sin(rad) * 10
              return (
                <span
                  key={angulo}
                  className="absolute rounded-[45%] bg-[#8a8072]"
                  style={{ left: x, top: y, width: 8, height: 6, transform: 'translate(-50%, -50%)' }}
                />
              )
            })}
            <span
              className="absolute rounded-full bg-[#5c4530]"
              style={{ left: '50%', top: '55%', width: 38, height: 3, transform: 'translate(-50%, -50%) rotate(-20deg)' }}
            />
            <span
              className="absolute rounded-full bg-[#6b5238]"
              style={{ left: '50%', top: '55%', width: 38, height: 3, transform: 'translate(-50%, -50%) rotate(20deg)' }}
            />
          </div>

          {/* Cavalete com quadro, no canto direito da elipse verde. */}
          <div
            className="absolute z-[1]"
            style={{ left: '80%', top: '46%', width: 44, height: 60, transform: 'translate(-50%, -50%)' }}
          >
            <span
              className="absolute rounded-full bg-[#6b5238]"
              style={{ left: 8.5, top: 44.5, width: 28, height: 2.5, transform: 'translate(-50%, -50%) rotate(104deg)' }}
            />
            <span
              className="absolute rounded-full bg-[#6b5238]"
              style={{ left: 35.5, top: 44.5, width: 28, height: 2.5, transform: 'translate(-50%, -50%) rotate(76deg)' }}
            />
            <span
              className="absolute rounded-full bg-[#5c4530]"
              style={{ left: 21.5, top: 41, width: 36, height: 2.5, transform: 'translate(-50%, -50%) rotate(85deg)' }}
            />
            <span
              className="absolute rounded-full bg-[#5c4530]"
              style={{ left: '50%', top: 30, width: 32, height: 2.5, transform: 'translate(-50%, -50%)' }}
            />
            <div
              className="absolute rounded-[2px] shadow-sm"
              style={{ left: 4, top: 0, width: 36, height: 30, background: '#5c4530' }}
            >
              <div className="absolute rounded-[1px] bg-[#f7f1e3]" style={{ inset: 2 }} />
            </div>
          </div>
        </div>

        {/* Fora da div de 14%/55% de propósito: cx/cy/rx/ry são medidos
            relativos ao ilhaRef (o container inteiro), então o Macu
            também precisa ser posicionado direto nele — aninhado dentro
            daquela div, o left/top calculado ficava relativo ao container
            errado e ele saía do card (bug real, achado testando). */}
        {rx > 0 &&
          ry > 0 &&
          outrosJogadores.map((jogador) => {
            const x = cx - rx + jogador.fx * (rx * 2)
            const y = cy - ry + jogador.fy * (ry * 2)
            // Outro professor (raro, mas possível) também é um pajé, um
            // pouco mais alto, pra manter a mesma diferenciação em qualquer tela.
            const ehProfessor = jogador.tipo === 'professor'
            const tamanho = ehProfessor ? 80 : 64
            return (
              <motion.div
                key={jogador.user_id}
                className="absolute z-[5]"
                animate={{ left: x, top: y }}
                transition={{ duration: INTERVALO_POLLING_MS / 1000, ease: 'linear' }}
              >
                <div className="relative" style={{ transform: 'translate(-50%, -82%)' }}>
                  {ehProfessor ? (
                    <PajeStage genero={jogador.avatar_config.gender ?? 'male'} tamanho={tamanho} comMoldura={false} />
                  ) : (
                    <AvatarStage
                      config={{ ...AVATAR_PADRAO, ...jogador.avatar_config }}
                      tamanho={tamanho}
                      comMoldura={false}
                      linha={LPC_FRAME_ROW}
                      coluna={0}
                    />
                  )}
                  <span className="absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/45 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    {jogador.nome}
                  </span>
                </div>
              </motion.div>
            )
          })}

        {bonecoEscolhido && (
          <MacuNaIlha
            ref={macuHandleRef}
            ilhaRef={ilhaRef}
            gramaRef={gramaRef}
            arvoreRef={arvoreRef}
            ativo
            userId={usuario?.id ?? null}
            multiplayerAtivo
            onEnviarPresenca={(fx, fy) => presencaApi.atualizarProfessor(okaId, fx, fy)}
            tamanho={80}
            renderPersonagem={({ linha, coluna, tamanho: t }) => (
              <PajeStage genero={generoProfessor} tamanho={t} comMoldura={false} linha={linha} coluna={coluna} />
            )}
          />
        )}
      </div>

      {avatarProfessorQuery.data && !bonecoEscolhido && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/50 backdrop-blur-sm">
          <p className="text-xs font-bold text-white">Escolha seu boneco (fase de teste)</p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => escolherAvatar.mutate('male')}
              disabled={escolherAvatar.isPending}
              className="rounded-xl border-2 border-white/40 bg-white/10 p-1 transition-colors hover:border-white disabled:opacity-50"
            >
              <PajeStage genero="male" tamanho={56} comMoldura={false} />
            </button>
            <button
              type="button"
              onClick={() => escolherAvatar.mutate('female')}
              disabled={escolherAvatar.isPending}
              className="rounded-xl border-2 border-white/40 bg-white/10 p-1 transition-colors hover:border-white disabled:opacity-50"
            >
              <PajeStage genero="female" tamanho={56} comMoldura={false} />
            </button>
          </div>
        </div>
      )}

      {data && outrosJogadores.length === 0 && bonecoEscolhido && (
        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/30 px-3 py-1 text-xs font-medium text-white">
          Só você na ilha agora
        </p>
      )}

      {data && data.length === 0 && !bonecoEscolhido && (
        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/30 px-3 py-1 text-xs font-medium text-white">
          Ninguém na ilha agora
        </p>
      )}
    </div>
  )
}

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { macuApi } from '../../../lib/apiClient'
import { AvatarStage } from '../../macu/AvatarStage'
import { AVATAR_PADRAO } from '../../macu/lpcData'
import { Ondulacao } from './Ondulacao'

type Fase = 'ocioso' | 'caindo' | 'ondulando' | 'pulando' | 'mergulhando' | 'saindo'

// Duração de cada fase (ms) antes de avançar pra próxima — controla o ritmo
// da metáfora inteira: perguntar é jogar uma gota no lago, aprender é
// mergulhar atrás dela.
const DURACAO: Partial<Record<Fase, number>> = {
  caindo: 650,
  ondulando: 850,
  pulando: 480,
  mergulhando: 720,
  saindo: 750,
}

const PROXIMA_FASE: Partial<Record<Fase, Fase>> = {
  caindo: 'ondulando',
  ondulando: 'pulando',
  pulando: 'mergulhando',
  mergulhando: 'saindo',
}

/**
 * Home do Ayvu — protótipo da experiência do lago.
 * Fluxo: busca -> gota cai -> ondulação -> Macu pula -> mergulha -> transição
 * pra tela "como você quer estudar isso".
 */
export function LagoaCena() {
  const navigate = useNavigate()
  const avatarQuery = useQuery({ queryKey: ['macu', 'avatar'], queryFn: macuApi.obterAvatar })
  const config = { ...AVATAR_PADRAO, ...avatarQuery.data?.avatar_config }

  const [termo, setTermo] = useState('')
  const [fase, setFase] = useState<Fase>('ocioso')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const duracao = DURACAO[fase]
    if (!duracao) return undefined

    const temporizador = setTimeout(() => {
      if (fase === 'saindo') {
        navigate(`/aluno/ayvu/estudar/${encodeURIComponent(termo.trim())}`)
        return
      }
      const proxima = PROXIMA_FASE[fase]
      if (proxima) setFase(proxima)
    }, duracao)

    return () => clearTimeout(temporizador)
  }, [fase, termo, navigate])

  function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    if (fase !== 'ocioso' || !termo.trim()) return
    inputRef.current?.blur()
    setFase('caindo')
  }

  const emMovimento = fase !== 'ocioso'
  // Macu some só depois de já ter mergulhado (na fase 'saindo', quando a
  // "câmera" cobre a cena) — durante 'mergulhando' ele precisa continuar
  // visível pra dar tempo de ver a animação do mergulho.
  const macuVisivel = fase !== 'saindo'

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#12313a]">
      <motion.div
        className="relative h-full w-full"
        style={{ transformOrigin: '50% 62%' }}
        animate={{ scale: fase === 'saindo' ? 1.9 : 1 }}
        transition={{ duration: 0.75, ease: 'easeIn' }}
      >
        {/* Céu */}
        <div className="absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-[#ffd9a8] via-[#f2a468] to-[#3c7681]" />

        {/* Sol/lua discreto no horizonte */}
        <div className="absolute left-1/2 top-[38%] h-24 w-24 -translate-x-1/2 rounded-full bg-[#ffedc2] opacity-80 blur-[2px]" />

        {/* Água */}
        <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-b from-[#4f8f92] via-[#215a63] to-[#0d2c34]">
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#ffd9a8]/40 to-transparent" />
          {/* brilho refletido do sol na água */}
          <div className="absolute left-1/2 top-2 h-16 w-10 -translate-x-1/2 rounded-full bg-[#ffedc2]/30 blur-md" />
        </div>

        {/* Postes de sustentação do pier, mergulhando na água */}
        <div className="absolute z-[3] w-[2.5%] rounded-b-sm bg-[#4a2c18]" style={{ right: '10%', top: '50%', height: '18%' }} />
        <div className="absolute z-[3] w-[2.5%] rounded-b-sm bg-[#4a2c18]" style={{ right: '34%', top: '50%', height: '18%' }} />

        {/* Deck do pier */}
        <div
          className="absolute z-[4] rounded-[2px] bg-gradient-to-b from-[#9a6a45] to-[#6b4429] shadow-md"
          style={{ right: '6%', top: '47%', width: '34%', height: '5.5%' }}
        >
          <div className="flex h-full w-full justify-evenly">
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} className="h-full w-px bg-black/25" />
            ))}
          </div>
        </div>

        {/* Macu na ponta do pier */}
        {macuVisivel && (
          <motion.div
            className="absolute z-[5]"
            style={{ left: '56%', top: '35%' }}
            animate={
              fase === 'ocioso'
                ? { y: [0, -4, 0] }
                : fase === 'pulando'
                  ? { y: [0, -46, -14], rotate: [0, -8, 6] }
                  : fase === 'mergulhando'
                    ? { y: [-14, 30, 90], rotate: [6, 24, 45], scale: [1, 0.92, 0.55], opacity: [1, 1, 0] }
                    : { y: 0 }
            }
            transition={
              fase === 'ocioso'
                ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
                : fase === 'pulando'
                  ? { duration: 0.48, ease: 'easeOut' }
                  : fase === 'mergulhando'
                    ? { duration: 0.72, ease: 'easeIn' }
                    : { duration: 0.3 }
            }
          >
            <AvatarStage config={config} tamanho={132} comMoldura={false} />
          </motion.div>
        )}

        {/* ondulação da gota caindo na água */}
        {(fase === 'ondulando' || fase === 'pulando' || fase === 'mergulhando' || fase === 'saindo') && (
          <Ondulacao x="50%" y="63%" tamanho={190} />
        )}

        {/* respingo do mergulho */}
        {(fase === 'mergulhando' || fase === 'saindo') && (
          <Ondulacao x="63%" y="75%" tamanho={260} cor="rgba(255,255,255,0.8)" atraso={0.1} />
        )}

        {/* Barra de busca -> gota */}
        <motion.form
          onSubmit={aoSubmeter}
          initial={false}
          animate={
            fase === 'ocioso'
              ? { top: '9%', width: 'min(88vw, 460px)', height: 56, borderRadius: 28, opacity: 1 }
              : {
                  top: fase === 'caindo' ? '64%' : '66%',
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  opacity: fase === 'caindo' ? 1 : 0,
                }
          }
          transition={
            fase === 'caindo'
              ? { duration: 0.65, ease: 'easeIn' }
              : { duration: fase === 'ocioso' ? 0.3 : 0.35, ease: 'easeOut' }
          }
          className="absolute left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 overflow-hidden border border-white/40 bg-white/90 px-5 shadow-xl backdrop-blur-md"
        >
          <motion.span
            className="flex w-full items-center gap-2"
            animate={{ opacity: fase === 'ocioso' ? 1 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <span aria-hidden className="text-lg">
              🔍
            </span>
            <input
              ref={inputRef}
              value={termo}
              onChange={(evento) => setTermo(evento.target.value)}
              placeholder="O que você quer descobrir?"
              disabled={emMovimento}
              className="w-full bg-transparent text-[0.95rem] text-[#2d2620] outline-none placeholder:text-[#8a7a6c]"
            />
          </motion.span>
        </motion.form>
      </motion.div>

      {/* "câmera" mergulhando: cobre a cena com um azul profundo até a próxima tela entrar */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-30 bg-[#0a2229]"
        initial={{ opacity: 0 }}
        animate={{ opacity: fase === 'saindo' ? 1 : 0 }}
        transition={{ duration: 0.75, ease: 'easeIn' }}
      />
    </div>
  )
}

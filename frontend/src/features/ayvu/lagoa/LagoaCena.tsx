import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ApiError, ayvuApi, macuApi, okaApi } from '../../../lib/apiClient'
import { useAuth } from '../../auth/AuthContext'
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

// Estrelas fixas (posição/tamanho sorteados 1x, não a cada render) — só
// aparecem de noite, de dia isso vira o brilho de sol na água mesmo.
const ESTRELAS = Array.from({ length: 18 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 45,
  tamanho: 1 + Math.random() * 1.8,
  opacidade: 0.4 + Math.random() * 0.6,
}))

function calcularEhNoite(): boolean {
  const hora = new Date().getHours()
  return hora >= 18 || hora < 6
}

/**
 * Home do Ayvu — protótipo da experiência do lago.
 * Fluxo: busca -> gota cai -> ondulação -> Macu pula -> mergulha -> transição
 * pra tela "como você quer estudar isso".
 */
export function LagoaCena() {
  const navigate = useNavigate()
  const { sair } = useAuth()
  const avatarQuery = useQuery({ queryKey: ['macu', 'avatar'], queryFn: macuApi.obterAvatar })
  const config = { ...AVATAR_PADRAO, ...avatarQuery.data?.avatar_config }

  const [termo, setTermo] = useState('')
  const [fase, setFase] = useState<Fase>('ocioso')
  const inputRef = useRef<HTMLInputElement>(null)
  // Calculado 1x na entrada da cena — não precisa reagir a mudança de hora
  // no meio da sessão do aluno.
  const ehNoite = useMemo(calcularEhNoite, [])

  const [mostrarEntrarOka, setMostrarEntrarOka] = useState(false)
  const [codigoOka, setCodigoOka] = useState('')
  const entrarOka = useMutation({
    mutationFn: (codigo: string) => okaApi.entrar(codigo),
    onSuccess: (dados) => {
      setCodigoOka('')
      setMostrarEntrarOka(false)
      window.alert(`Você entrou na Oka "${dados.nome_oka}"!`)
    },
  })

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
    const termoFinal = termo.trim()
    if (fase !== 'ocioso' || !termoFinal) return
    inputRef.current?.blur()
    setFase('caindo')
    // Best-effort: alimenta a visão do professor por aluno (ver
    // routers/okas.py). Não bloqueia a animação nem trava o fluxo se falhar.
    void ayvuApi.registrarPesquisa(termoFinal).catch(() => {})
  }

  const emMovimento = fase !== 'ocioso'
  // Macu some só depois de já ter mergulhado (na fase 'saindo', quando a
  // "câmera" cobre a cena) — durante 'mergulhando' ele precisa continuar
  // visível pra dar tempo de ver a animação do mergulho.
  const macuVisivel = fase !== 'saindo'

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#12313a]">
      {!emMovimento && (
        <div className="absolute right-4 top-4 z-40 flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/aluno/macu')}
              className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur hover:bg-white/25"
            >
              🧑‍🎨 Meu Macu
            </button>
            <button
              type="button"
              onClick={() => navigate('/aluno/oka')}
              className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur hover:bg-white/25"
            >
              👥 Oka
            </button>
            <button
              type="button"
              onClick={() => navigate('/aluno/boletim')}
              className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur hover:bg-white/25"
            >
              📋 Boletim
            </button>
            <button
              type="button"
              onClick={() => setMostrarEntrarOka((atual) => !atual)}
              className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur hover:bg-white/25"
            >
              🏝️ Entrar numa Oka
            </button>
            <button
              type="button"
              onClick={sair}
              className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur hover:bg-white/25"
            >
              Sair
            </button>
          </div>

          {mostrarEntrarOka && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (codigoOka.trim()) entrarOka.mutate(codigoOka.trim())
              }}
              className="flex flex-col gap-2 rounded-2xl border border-white/30 bg-white/95 p-3 shadow-xl"
            >
              <label className="text-xs font-bold text-[#2d2620]">Código da Oka</label>
              <input
                autoFocus
                value={codigoOka}
                onChange={(e) => setCodigoOka(e.target.value.toUpperCase())}
                placeholder="ex: AYVU4X"
                maxLength={10}
                className="w-40 rounded-lg border border-border bg-[#fffaf3] px-2.5 py-1.5 text-sm uppercase tracking-widest text-[#2d2620] outline-none focus:border-accent"
              />
              {entrarOka.isError && (
                <p className="max-w-40 text-xs font-semibold text-erro">
                  {entrarOka.error instanceof ApiError ? entrarOka.error.message : 'Não foi possível entrar.'}
                </p>
              )}
              <button
                type="submit"
                disabled={entrarOka.isPending || !codigoOka.trim()}
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-50"
              >
                {entrarOka.isPending ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}
        </div>
      )}

      <motion.div
        className="relative mx-auto h-full w-full max-w-[1200px]"
        style={{ transformOrigin: '50% 78%' }}
        animate={{ scale: fase === 'saindo' ? 1.9 : 1 }}
        transition={{ duration: 0.75, ease: 'easeIn' }}
      >
        {/* Logo discreta no canto — só em repouso, some junto com os botões durante o mergulho */}
        {!emMovimento && (
          <img
            src="/assets/logo.png"
            alt="AYVU"
            className="absolute left-4 top-4 z-40 h-7 w-auto opacity-90 drop-shadow-sm"
          />
        )}

        {/* Céu — muda de dia/noite conforme o horário real do aparelho */}
        <div
          className={`absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b ${
            ehNoite
              ? 'from-[#161c3a] via-[#232f52] to-[#1c3a44]'
              : 'from-[#ffd9a8] via-[#f2a468] to-[#3c7681]'
          }`}
        >
          {ehNoite &&
            ESTRELAS.map((estrela, i) => (
              <span
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  left: `${estrela.x}%`,
                  top: `${estrela.y}%`,
                  width: estrela.tamanho,
                  height: estrela.tamanho,
                  opacity: estrela.opacidade,
                }}
              />
            ))}
        </div>

        {/* Sol de dia, lua de noite */}
        {ehNoite ? (
          <div className="absolute left-1/2 top-[38%] h-24 w-24 -translate-x-1/2 rounded-full bg-[#e7ecf5] opacity-90">
            <span className="absolute left-[18%] top-[22%] h-3 w-3 rounded-full bg-[#c7d0e0]" />
            <span className="absolute left-[55%] top-[45%] h-4 w-4 rounded-full bg-[#c7d0e0]" />
            <span className="absolute left-[35%] top-[62%] h-2.5 w-2.5 rounded-full bg-[#c7d0e0]" />
          </div>
        ) : (
          <div className="absolute left-1/2 top-[38%] h-24 w-24 -translate-x-1/2 rounded-full bg-[#ffedc2] opacity-80 blur-[2px]" />
        )}

        {/* Água */}
        <div
          className={`absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-b ${
            ehNoite ? 'from-[#1f4650] via-[#173f47] to-[#0d2c34]' : 'from-[#4f8f92] via-[#215a63] to-[#0d2c34]'
          }`}
        >
          <div
            className={`absolute inset-x-0 top-0 h-10 bg-gradient-to-b to-transparent ${
              ehNoite ? 'from-[#232f52]/40' : 'from-[#ffd9a8]/40'
            }`}
          />
          {/* brilho refletido do sol/lua na água */}
          <div
            className={`absolute left-1/2 top-2 h-16 w-10 -translate-x-1/2 rounded-full blur-md ${
              ehNoite ? 'bg-[#e7ecf5]/20' : 'bg-[#ffedc2]/30'
            }`}
          />
        </div>

        {/* Ilha — onde o Macu mora entre uma pesquisa e outra, no meio da lagoa */}
        <div className="absolute z-[3]" style={{ left: '24%', top: '57%', width: '52%', height: '20%' }}>
          {/* areia, base elíptica que "mergulha" na água */}
          <div
            className={`absolute inset-x-0 bottom-0 h-[62%] rounded-[50%] shadow-lg ${
              ehNoite ? 'bg-gradient-to-b from-[#6b6248] to-[#4a4433]' : 'bg-gradient-to-b from-[#e3cd94] to-[#c2a35f]'
            }`}
          />
          {/* grama, elipse menor por cima da areia */}
          <div
            className={`absolute inset-x-[10%] top-0 h-[68%] rounded-[50%] ${
              ehNoite ? 'bg-gradient-to-b from-[#2c4a2a] to-[#1e3620]' : 'bg-gradient-to-b from-[#5f9448] to-[#3f6c32]'
            }`}
          />
          {/* tufos de grama e uma pedrinha, só decoração */}
          <span
            className={`absolute h-3 w-1.5 rounded-full ${ehNoite ? 'bg-[#233f22]' : 'bg-[#3f6c32]'}`}
            style={{ left: '22%', top: '8%', transform: 'rotate(-12deg)' }}
          />
          <span
            className={`absolute h-3.5 w-1.5 rounded-full ${ehNoite ? 'bg-[#233f22]' : 'bg-[#3f6c32]'}`}
            style={{ left: '28%', top: '2%', transform: 'rotate(6deg)' }}
          />
          <span
            className={`absolute h-2.5 w-1.5 rounded-full ${ehNoite ? 'bg-[#233f22]' : 'bg-[#3f6c32]'}`}
            style={{ right: '18%', top: '10%', transform: 'rotate(14deg)' }}
          />
          <span
            className={`absolute h-3 w-4 rounded-full ${ehNoite ? 'bg-[#5c5847]' : 'bg-[#9a8b63]'}`}
            style={{ left: '12%', bottom: '18%' }}
          />

          {/* Coqueiro — do lado do Macu, sem encostar nele */}
          <div className="absolute z-[1]" style={{ left: '8%', bottom: '28%', width: 110, height: 150 }}>
            {/* tronco, levemente curvado */}
            <div
              className={`absolute bottom-0 left-[30%] w-3 origin-bottom rounded-full ${
                ehNoite ? 'bg-[#3a2a1c]' : 'bg-[#7a5636]'
              }`}
              style={{ height: '72%', transform: 'rotate(-10deg)' }}
            />
            {/* folhas, um leque de elipses saindo do topo do tronco */}
            {[-65, -32, -2, 28, 58].map((angulo) => (
              <span
                key={angulo}
                className="absolute rounded-[50%] border border-black/30 bg-[#2f7a2a]"
                style={{
                  left: '38%',
                  top: '26%',
                  width: 52,
                  height: 14,
                  transformOrigin: '0% 50%',
                  transform: `rotate(${angulo}deg)`,
                }}
              />
            ))}
            {/* cocos */}
            <span
              className={`absolute h-3 w-3 rounded-full ${ehNoite ? 'bg-[#2a1c12]' : 'bg-[#5c3d22]'}`}
              style={{ left: '33%', top: '31%' }}
            />
            <span
              className={`absolute h-3 w-3 rounded-full ${ehNoite ? 'bg-[#2a1c12]' : 'bg-[#5c3d22]'}`}
              style={{ left: '41%', top: '34%' }}
            />
          </div>
        </div>

        {/* Macu na ilha */}
        {macuVisivel && (
          <motion.div
            className="absolute z-[5]"
            style={{ right: '45%', top: '50%' }}
            animate={
              fase === 'pulando'
                ? { y: [0, -46, -14], rotate: [0, -8, 6] }
                : fase === 'mergulhando'
                  ? { y: [-14, 30, 90], rotate: [6, 24, 45], scale: [1, 0.92, 0.55], opacity: [1, 1, 0] }
                  : { y: 0 }
            }
            transition={
              fase === 'pulando'
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
          <Ondulacao x="50%" y="82%" tamanho={190} />
        )}

        {/* respingo do mergulho */}
        {(fase === 'mergulhando' || fase === 'saindo') && (
          <Ondulacao x="36%" y="94%" tamanho={260} cor="rgba(255,255,255,0.8)" atraso={0.1} />
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

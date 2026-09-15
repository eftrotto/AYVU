import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { macuApi, ocaPessoalApi } from '../../lib/apiClient'
import { useAuth } from '../auth/AuthContext'
import { AvatarStage } from '../macu/AvatarStage'
import { AVATAR_PADRAO } from '../macu/lpcData'
import { NivelBar } from '../macu/NivelBar'
import { COR_TELHADO, ITENS_CENTRAIS, sombrear } from './ocaData'

const PADRAO = { cor_parede: 'c2a35f', cor_chao: '7a5636', item_central: 'nenhum' }

// Fachada da Oca vista de fora, em coordenadas de um viewBox 0-100 —
// telhado triangular com as varas do ápice cruzando e escapando pra fora
// do contorno (jeito real de amarrar as varas numa oca), paredes retas e
// uma porta em arco na base. Formato desenhado à mão pelo usuário como
// referência.
const APICE = { x: 50, y: 14 }
const TELHADO_ESQ = { x: 13, y: 47 }
const TELHADO_DIR = { x: 87, y: 47 }
const PAREDE_ESQ_BASE = { x: 20, y: 81 }
const PAREDE_DIR_BASE = { x: 80, y: 81 }
const PORTA_TOPO_Y = 56
const PORTA_ESQ_X = 41
const PORTA_DIR_X = 59
const CHAO_Y = 81

function pontoNoMeio(a: { x: number; y: number }, b: { x: number; y: number }, fracao: number) {
  return { x: a.x + (b.x - a.x) * fracao, y: a.y + (b.y - a.y) * fracao }
}

// Feixe de varas amarradas no ápice: cada uma nasce perto da borda do
// telhado (esquerda ou direita) e a ponta escapa pro lado OPOSTO, um
// pouco acima do ápice — é isso que cria o efeito de "cruzado" do desenho.
const N_VARAS = 11
const VARAS = Array.from({ length: N_VARAS }, (_, i) => {
  const t = i / (N_VARAS - 1) // 0..1
  const distanciaDoCentro = Math.abs(t - 0.5) * 2 // 0 no meio, 1 nas pontas
  const ladoEsq = t < 0.5
  const base = pontoNoMeio(APICE, ladoEsq ? TELHADO_ESQ : TELHADO_DIR, 0.3 + distanciaDoCentro * 0.55)
  const ponta = {
    x: APICE.x + (ladoEsq ? 1 : -1) * (7 + distanciaDoCentro * 27),
    y: APICE.y - (5 + distanciaDoCentro * 8),
  }
  return { base, ponta }
})

// Gravetos e pedras da fogueira — apagada, sem chama de emoji.
const GRAVETOS = [-24, -8, 8, 24, -16, 16]
const PEDRAS = Array.from({ length: 10 }, (_, i) => {
  const angulo = (i / 10) * Math.PI * 2
  return { x: Math.cos(angulo) * 72, y: Math.sin(angulo) * 24 }
})

/**
 * Oka — o espaço pessoal do aluno, inspirado numa oca indígena (com uma
 * ponta de Club Penguin). Fachada vista de fora: telhado triangular com
 * as varas do ápice cruzando pra fora, paredes retas e porta em arco,
 * numa clareira. Protótipo visual por enquanto — personalização
 * (cores/itens) fica pra uma próxima etapa.
 */
export function OkaPage() {
  const navigate = useNavigate()
  const { sair } = useAuth()

  const ocaQuery = useQuery({ queryKey: ['oca'], queryFn: ocaPessoalApi.obter })
  const avatarQuery = useQuery({ queryKey: ['macu', 'avatar'], queryFn: macuApi.obterAvatar })
  const config = { ...AVATAR_PADRAO, ...avatarQuery.data?.avatar_config }

  const decoracao = ocaQuery.data ?? PADRAO
  const itemInfo = ITENS_CENTRAIS.find((i) => i.valor === decoracao.item_central) ?? ITENS_CENTRAIS[0]
  const temFogo = itemInfo.valor === 'fogueira'

  return (
    <div
      className="relative h-dvh w-full overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #fdf0d4 0%, #f6d9a6 45%, #e8b97a 78%, #d9a668 100%)' }}
    >
      {/* Chão (elipse de grama/terra em primeiro plano) */}
      <div
        className="absolute rounded-[50%] shadow-2xl"
        style={{
          left: '-6%',
          top: '62%',
          width: '112%',
          height: '46%',
          background: `radial-gradient(ellipse at 50% 18%, #${decoracao.cor_chao} 0%, #${sombrear(decoracao.cor_chao, 0.2)} 45%, #${sombrear(decoracao.cor_chao, 0.4)} 100%)`,
        }}
      />

      {/* Fachada da Oca */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* sombra da oca no chão */}
        <ellipse cx={50} cy={82} rx={38} ry={5} fill="rgba(0,0,0,0.18)" />

        {/* paredes (trapézio reto, atrás da porta) */}
        <polygon
          points={`${TELHADO_ESQ.x},${TELHADO_ESQ.y} ${TELHADO_DIR.x},${TELHADO_DIR.y} ${PAREDE_DIR_BASE.x},${PAREDE_DIR_BASE.y} ${PAREDE_ESQ_BASE.x},${PAREDE_ESQ_BASE.y}`}
          fill={`#${decoracao.cor_parede}`}
          stroke={`#${sombrear(decoracao.cor_parede, 0.35)}`}
          strokeWidth={0.6}
        />
        {/* sombra lateral direita da parede, pra dar volume */}
        <polygon
          points={`${pontoNoMeio(TELHADO_ESQ, TELHADO_DIR, 0.62).x},${TELHADO_DIR.y} ${TELHADO_DIR.x},${TELHADO_DIR.y} ${PAREDE_DIR_BASE.x},${PAREDE_DIR_BASE.y} ${pontoNoMeio(PAREDE_ESQ_BASE, PAREDE_DIR_BASE, 0.62).x},${PAREDE_DIR_BASE.y}`}
          fill={`#${sombrear(decoracao.cor_parede, 0.22)}`}
          opacity={0.7}
        />

        {/* porta em arco */}
        <path
          d={`M ${PORTA_ESQ_X} ${CHAO_Y} L ${PORTA_ESQ_X} ${PORTA_TOPO_Y + 6} Q ${PORTA_ESQ_X} ${PORTA_TOPO_Y} 50 ${PORTA_TOPO_Y} Q ${PORTA_DIR_X} ${PORTA_TOPO_Y} ${PORTA_DIR_X} ${PORTA_TOPO_Y + 6} L ${PORTA_DIR_X} ${CHAO_Y} Z`}
          fill="#241708"
        />
        <path
          d={`M ${PORTA_ESQ_X} ${CHAO_Y} L ${PORTA_ESQ_X} ${PORTA_TOPO_Y + 6} Q ${PORTA_ESQ_X} ${PORTA_TOPO_Y} 50 ${PORTA_TOPO_Y} Q ${PORTA_DIR_X} ${PORTA_TOPO_Y} ${PORTA_DIR_X} ${PORTA_TOPO_Y + 6} L ${PORTA_DIR_X} ${CHAO_Y} Z`}
          fill="url(#brilhoPorta)"
        />

        {/* telhado (triângulo) */}
        <polygon
          points={`${APICE.x},${APICE.y} ${TELHADO_ESQ.x},${TELHADO_ESQ.y} ${TELHADO_DIR.x},${TELHADO_DIR.y}`}
          fill={`#${COR_TELHADO}`}
          stroke={`#${sombrear(COR_TELHADO, 0.3)}`}
          strokeWidth={0.6}
        />
        {/* sombra lateral direita do telhado */}
        <polygon
          points={`${APICE.x},${APICE.y} ${pontoNoMeio(TELHADO_ESQ, TELHADO_DIR, 0.5).x},${pontoNoMeio(TELHADO_ESQ, TELHADO_DIR, 0.5).y} ${TELHADO_DIR.x},${TELHADO_DIR.y}`}
          fill={`#${sombrear(COR_TELHADO, 0.22)}`}
          opacity={0.75}
        />
        {/* linhas de palha do telhado */}
        {Array.from({ length: 6 }, (_, i) => {
          const fracao = 0.18 + i * 0.14
          const e = pontoNoMeio(APICE, TELHADO_ESQ, fracao)
          const d = pontoNoMeio(APICE, TELHADO_DIR, fracao)
          return (
            <line
              key={i}
              x1={e.x}
              y1={e.y}
              x2={d.x}
              y2={d.y}
              stroke={`#${sombrear(COR_TELHADO, 0.15)}`}
              strokeWidth={0.35}
              opacity={0.5}
              vectorEffect="non-scaling-stroke"
            />
          )
        })}

        {/* feixe de varas cruzadas no ápice, escapando pro lado de fora */}
        {VARAS.map((vara, i) => (
          <line
            key={i}
            x1={vara.base.x}
            y1={vara.base.y}
            x2={vara.ponta.x}
            y2={vara.ponta.y}
            stroke={`#${sombrear(COR_TELHADO, i % 2 === 0 ? 0.35 : 0.5)}`}
            strokeWidth={0.55}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {/* amarração no ápice */}
        <circle cx={APICE.x} cy={APICE.y + 2} r={2.4} fill={`#${sombrear(COR_TELHADO, 0.55)}`} />

        <defs>
          <linearGradient id="brilhoPorta" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,180,90,0.28)" />
            <stop offset="55%" stopColor="rgba(255,140,60,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>
      </svg>

      {itemInfo.valor !== 'nenhum' && (
        <div className="absolute -translate-x-1/2" style={{ top: '78%', left: '72%' }}>
          {temFogo ? (
            <div className="relative" style={{ width: 140, height: 62 }}>
              {/* brasa: brilho morno e baixo, sem parecer chama de desenho */}
              <div
                className="pointer-events-none absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: 114,
                  height: 52,
                  background: 'radial-gradient(ellipse, rgba(255,140,40,0.32) 0%, rgba(255,90,20,0.1) 55%, rgba(255,90,20,0) 78%)',
                  filter: 'blur(2px)',
                }}
              />
              {/* pedras em roda */}
              {PEDRAS.map((p, i) => (
                <span
                  key={i}
                  className="absolute left-1/2 top-[62%] block rounded-[45%] shadow-sm"
                  style={{
                    width: 13,
                    height: 9,
                    transform: `translate(calc(-50% + ${p.x * 0.87}px), calc(-50% + ${p.y * 0.87}px)) rotate(${(i * 37) % 360}deg)`,
                    background: `linear-gradient(160deg, #${sombrear('8a8072', i % 2 === 0 ? 0.05 : 0.25)} 0%, #${sombrear('8a8072', 0.4)} 100%)`,
                  }}
                />
              ))}
              {/* pilha de gravetos cruzados, apagada */}
              {GRAVETOS.map((angulo, i) => (
                <span
                  key={i}
                  className="absolute left-1/2 top-[55%] block rounded-full"
                  style={{
                    width: 72,
                    height: 5,
                    transform: `translate(-50%, -50%) rotate(${angulo}deg)`,
                    background: `linear-gradient(90deg, #${sombrear('5c4530', 0.3)} 0%, #${sombrear('5c4530', i % 2 === 0 ? 0.05 : 0.15)} 45%, #${sombrear('5c4530', 0.35)} 100%)`,
                    boxShadow: '0 2px 3px rgba(0,0,0,0.35)',
                  }}
                />
              ))}
              <span
                className="absolute left-1/2 top-[55%] block -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
                style={{ width: 26, height: 12, backgroundColor: '#2a2015', opacity: 0.7 }}
              />
            </div>
          ) : (
            <span className="relative block text-5xl drop-shadow-lg" aria-hidden>
              {itemInfo.emoji}
            </span>
          )}
        </div>
      )}

      <div className="absolute" style={{ top: '58%', left: '24%' }}>
        <AvatarStage config={config} tamanho={140} comMoldura={false} />
      </div>

      {/* Cabeçalho */}
      <div className="absolute left-1/2 top-6 z-30 -translate-x-1/2 text-center">
        <h1 className="text-2xl font-bold text-text drop-shadow-sm sm:text-3xl">Oka</h1>
        <p className="text-sm font-medium text-text/80 drop-shadow-sm">Dê forma à sua voz</p>
      </div>

      {/* Logo + nível */}
      <div className="absolute left-4 top-4 z-30 rounded-2xl bg-white/40 px-3.5 py-3 backdrop-blur-sm">
        <img src="/assets/logo.png" alt="AYVU" className="mb-2 h-6 w-auto" />
        <NivelBar variante="claro" />
      </div>

      {/* Navegação */}
      <div className="absolute right-4 top-4 z-30 flex gap-2">
        <button
          type="button"
          onClick={() => navigate('/aluno/ayvu')}
          className="rounded-full border border-white/60 bg-white/90 px-4 py-2 text-sm font-bold text-text backdrop-blur hover:bg-white"
        >
          ‹ Voltar pro Ayvu
        </button>
        <button
          type="button"
          onClick={sair}
          className="rounded-full border border-white/60 bg-white/90 px-4 py-2 text-sm font-bold text-text backdrop-blur hover:bg-white"
        >
          Sair
        </button>
      </div>
    </div>
  )
}

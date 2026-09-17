// Boneco do professor — o MESMO Macu do aluno (sprites LPC, ver
// AvatarStage.tsx), só com adornos indígenas desenhados por cima (cocar,
// pintura facial, cachimbo da paz, lança só de madeira), pra dar a vibe do
// resto do app (Oka, Reko, Itá) sem inventar um corpo novo. Fase de teste:
// 2 presets fixos (masculino/feminino — ver lpcData.ts), sem tela de
// customização. As posições (BASE, faixa do rosto, cachimbo) foram medidas
// direto nos pixels do canvas do AvatarStage (ver DevTools/console usado
// pra calibrar), não são um chute.
import { AvatarStage } from './AvatarStage'
import { AVATAR_PROFESSOR_FEMININO, AVATAR_PROFESSOR_MASCULINO, LPC_FRAME_ROW } from './lpcData'

interface PajeStageProps {
  genero: 'male' | 'female'
  tamanho?: number
  comMoldura?: boolean
  linha?: number
  coluna?: number
}

const PENAS = [
  { angulo: -170, dist: 9, cor: '#d94f3d' },
  { angulo: -140, dist: 12, cor: '#f0b429' },
  { angulo: -110, dist: 13.5, cor: '#3f7d3f' },
  { angulo: -90, dist: 14.5, cor: '#3a7ca5' },
  { angulo: -70, dist: 13.5, cor: '#3f7d3f' },
  { angulo: -40, dist: 12, cor: '#f0b429' },
  { angulo: -10, dist: 9, cor: '#d94f3d' },
]

// Base do cocar em % da altura/largura TOTAL do boneco (0=topo do quadro) —
// medido direto nos pixels do canvas do AvatarStage (topo do cabelo ~20%,
// centro horizontal ~50%). y um pouco maior que os 20% medidos (encosta
// LEVE por cima do cabelo) pra não sobrar vão/flutuar acima da testa.
const BASE = { x: 50, y: 20.5 }

// Adornos sobrepostos no MESMO quadro do AvatarStage (viewBox 0-100/0-100,
// igual ao box do boneco) — mais fácil de acertar a posição pensando em %
// da altura/largura toda do personagem do que num sub-retângulo separado.
// Cocar e lança ficam bem em qualquer direção (topo da cabeça / diagonal
// nas costas não dependem de ver o rosto), mas pintura facial e cachimbo
// são desenhados pra posição das bochechas/boca de frente — de perfil
// (andando pro lado) ficavam flutuando estranhos sobre o corpo, então só
// aparecem quando o boneco está de frente (linha === LPC_FRAME_ROW).
function Adornos({ deFrente }: { deFrente: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      {/* cocar de penas */}
      {PENAS.map((p) => {
        const rad = (p.angulo * Math.PI) / 180
        const tipX = BASE.x + Math.cos(rad) * p.dist
        const tipY = BASE.y + Math.sin(rad) * p.dist
        const perp = rad + Math.PI / 2
        const w = 1.9
        const p1x = BASE.x + Math.cos(perp) * w
        const p1y = BASE.y + Math.sin(perp) * w
        const p2x = BASE.x - Math.cos(perp) * w
        const p2y = BASE.y - Math.sin(perp) * w
        return (
          <g key={p.angulo}>
            <polygon points={`${p1x},${p1y} ${tipX},${tipY} ${p2x},${p2y}`} fill={p.cor} />
            <circle cx={tipX} cy={tipY} r={1} fill="#f7f1e3" />
          </g>
        )
      })}
      <rect x={BASE.x - 9.5} y={BASE.y - 1.8} width={19} height={3.6} rx={1.4} fill="#7a5636" />

      {/* lança, só a madeira (sem ponta) — presa nas costas na diagonal
          (não na mão: a mão muda de posição a cada quadro de caminhada, e
          o adorno fica fixo, então "na mão" desalinhava ao andar). */}
      <line x1={30} y1={93} x2={68} y2={19} stroke="#6b5238" strokeWidth={3} strokeLinecap="round" />

      {deFrente && (
        <>
          {/* pintura facial — uma marca em cada bochecha (não uma faixa
              contínua, que ficava parecendo uma venda), abaixo dos olhos e
              longe do nariz (rosto visível fica entre ~39% e ~49% de
              altura; olhos por volta de 42%) */}
          <rect x={32.5} y={45} width={9} height={3.4} rx={1.4} fill="#c1442c" opacity={0.92} />
          <rect x={58.5} y={45} width={9} height={3.4} rx={1.4} fill="#c1442c" opacity={0.92} />

          {/* cachimbo da paz, saindo do canto da boca (~47% de altura) —
              perto do queixo, sem chegar na zona do ombro/braço (que
              começa por volta de x=68% aí embaixo) senão fica escondido
              atrás do braço. Traços grossos de propósito: nessa escala
              (56-160px) qualquer coisa fina vira 1px e some. */}
          <line x1={56} y1={45.5} x2={65} y2={48.5} stroke="#8a6a4a" strokeWidth={2.8} strokeLinecap="round" />
          <rect x={64} y={46.3} width={6} height={6} rx={1.4} fill="#3a2a1c" stroke="#1f1610" strokeWidth={0.6} />
          <circle cx={68.5} cy={42} r={1.8} fill="#e8e8e8" opacity={0.55} />
          <circle cx={70.5} cy={37} r={2.4} fill="#e8e8e8" opacity={0.4} />
        </>
      )}
    </svg>
  )
}

export function PajeStage({ genero, tamanho = 320, comMoldura = true, linha = LPC_FRAME_ROW, coluna = 0 }: PajeStageProps) {
  const config = genero === 'male' ? AVATAR_PROFESSOR_MASCULINO : AVATAR_PROFESSOR_FEMININO
  return (
    <div className="relative" style={{ width: tamanho, height: tamanho }}>
      <AvatarStage config={config} tamanho={tamanho} comMoldura={comMoldura} linha={linha} coluna={coluna} />
      <Adornos deFrente={linha === LPC_FRAME_ROW} />
    </div>
  )
}

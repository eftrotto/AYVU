import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { macuApi, ocaPessoalApi } from '../../lib/apiClient'
import { useAuth } from '../auth/AuthContext'
import { AVATAR_PADRAO } from '../macu/lpcData'
import { NivelBar } from '../macu/NivelBar'
import { COR_TELHADO, ITENS_CENTRAIS, sombrear } from './ocaData'
import { MacuNaOka, type MacuNaOkaHandle } from './MacuNaOka'

const PADRAO = { cor_parede: 'c2a35f', cor_chao: '7a5636', item_central: 'nenhum' }

// Fachada da Oca vista de fora, "câmera" bem próxima (pouca margem em volta),
// em coordenadas de um viewBox 0-100. Parede e porta são transparentes (só o
// contorno é desenhado) pra dar o efeito "dollhouse" — a decoração interna
// (chão + item central + Macu) fica visível através delas.
const APICE = { x: 50, y: 12 }
const TELHADO_ESQ = { x: 2, y: 50 }
const TELHADO_DIR = { x: 98, y: 50 }

// Sombra da Oka no chão — fonte única de verdade pro desenho da sombra
// (svg), pra elipse de locomoção do Macu E pra base da parede (que agora
// encosta exatamente na ponta mais larga dessa elipse), pra tudo ficar
// realmente conectado em vez de coordenadas soltas que só "quase" batem.
const SOMBRA_OKA = { cx: 50, cy: 90, rx: 46, ry: 5 }

// Elipse navegável do Macu, em % do container — a própria sombra da Oka.
const CHAO_ELIPSE = {
  left: SOMBRA_OKA.cx - SOMBRA_OKA.rx,
  top: SOMBRA_OKA.cy - SOMBRA_OKA.ry,
  width: SOMBRA_OKA.rx * 2,
  height: SOMBRA_OKA.ry * 2,
}

// A parede começa um pouco pra dentro da borda do telhado (o beiral
// "sobra" por cima dela, como um telhado de verdade) e é mais ESTREITA no
// topo do que na base — afunila pra dentro perto do telhado. A base
// encosta exatamente nas duas pontas (esquerda/direita) da elipse do
// chão — é essa mesma ponta que a curva da base (ver CAMINHO_PAREDE)
// parte pra fazer o "sorriso".
const PAREDE_TOPO_ESQ = { x: 10, y: 50 }
const PAREDE_TOPO_DIR = { x: 90, y: 50 }
const PAREDE_ESQ_BASE = { x: SOMBRA_OKA.cx - SOMBRA_OKA.rx, y: SOMBRA_OKA.cy }
const PAREDE_DIR_BASE = { x: SOMBRA_OKA.cx + SOMBRA_OKA.rx, y: SOMBRA_OKA.cy }
const PORTA_TOPO_Y = 63
const PORTA_ESQ_X = 38
const PORTA_DIR_X = 62
// Onde a porta encontra o chão — o ponto mais fundo da curva "Q 50 100"
// da base (ver CAMINHO_PAREDE): pra uma bezier quadrática com os dois
// extremos em PAREDE_ESQ_BASE.y e controle em y=100, o ponto médio (x=50,
// onde a porta fica centralizada) é 0.5*PAREDE_ESQ_BASE.y + 50.
const CHAO_Y = 0.5 * PAREDE_ESQ_BASE.y + 50

function pontoNoMeio(a: { x: number; y: number }, b: { x: number; y: number }, fracao: number) {
  return { x: a.x + (b.x - a.x) * fracao, y: a.y + (b.y - a.y) * fracao }
}

// Contorno da parede: os dois LADOS são linhas retas (como um cilindro
// visto de frente — nada de estufar pra fora), e só a BASE (onde encontra
// o chão) é curva, um "sorriso" acompanhando a elipse do piso.
const CAMINHO_PAREDE = [
  `M ${PAREDE_TOPO_ESQ.x} ${PAREDE_TOPO_ESQ.y}`,
  `L ${PAREDE_TOPO_DIR.x} ${PAREDE_TOPO_DIR.y}`,
  `L ${PAREDE_DIR_BASE.x} ${PAREDE_DIR_BASE.y}`,
  `Q 50 100 ${PAREDE_ESQ_BASE.x} ${PAREDE_ESQ_BASE.y}`,
  `L ${PAREDE_TOPO_ESQ.x} ${PAREDE_TOPO_ESQ.y}`,
  'Z',
].join(' ')

// Gravetos e pedras da fogueira — apagada, sem chama de emoji.
const GRAVETOS = [-24, -8, 8, 24, -16, 16]
const PEDRAS = Array.from({ length: 10 }, (_, i) => {
  const angulo = (i / 10) * Math.PI * 2
  return { x: Math.cos(angulo) * 72, y: Math.sin(angulo) * 24 }
})

/**
 * Oka — o espaço pessoal do aluno, inspirado numa oca indígena (com uma
 * ponta de Club Penguin). Fachada vista de fora, em close: telhado de
 * palha (tufos trançados), parede e porta transparentes (efeito
 * dollhouse) revelando o céu por trás, e um piso com textura própria
 * (faixas horizontais, diferente do nada-trançado da parede) com o item
 * central e o Macu, que anda livre por ele (clamp elíptico, igual à ilha
 * principal). Protótipo visual por enquanto — personalização
 * (cores/itens) fica pra uma próxima etapa.
 */
export function OkaPage() {
  const navigate = useNavigate()
  const { usuario, sair } = useAuth()
  const cenaRef = useRef<HTMLDivElement>(null)
  const chaoRef = useRef<HTMLDivElement>(null)
  const macuRef = useRef<MacuNaOkaHandle>(null)

  const ocaQuery = useQuery({ queryKey: ['oca'], queryFn: ocaPessoalApi.obter })
  const avatarQuery = useQuery({ queryKey: ['macu', 'avatar'], queryFn: macuApi.obterAvatar })
  const config = { ...AVATAR_PADRAO, ...avatarQuery.data?.avatar_config }

  const decoracao = ocaQuery.data ?? PADRAO
  const itemInfo = ITENS_CENTRAIS.find((i) => i.valor === decoracao.item_central) ?? ITENS_CENTRAIS[0]
  const temFogo = itemInfo.valor === 'fogueira'

  return (
    <div
      className="relative h-dvh w-full overflow-hidden"
      style={{ background: '#6ec3e8' }}
    >
      <div
        ref={cenaRef}
        className="absolute inset-0"
        onClick={(e) => macuRef.current?.moverPara(e.clientX, e.clientY)}
      >
        {/* Solzinho no canto do céu */}
        <div
          className="pointer-events-none absolute right-[8%] top-[6%] h-16 w-16 rounded-full bg-[#fff3c4]"
          style={{ boxShadow: '0 0 40px 14px rgba(255, 243, 196, 0.55)' }}
        />

        {/* Chão (elipse de terra) — cobre só a parte de baixo, tipo o piso
            "de fato" da cena. Propositalmente NÃO sobe até o topo da
            parede: entre o beiral do telhado e aqui, quem aparece atrás da
            parede/porta transparentes é o céu de verdade, senão a
            transparência delas fica invisível (mesma cor por trás). */}
        <div
          className="absolute rounded-[50%] shadow-2xl"
          style={{
            left: '-20%',
            top: '86%',
            width: '140%',
            height: '20%',
            background: `radial-gradient(ellipse at 50% 12%, #${decoracao.cor_chao} 0%, #${sombrear(decoracao.cor_chao, 0.2)} 45%, #${sombrear(decoracao.cor_chao, 0.4)} 100%)`,
          }}
        />

        {/* Chão interno navegável (invisível — só define a elipse de
            colisão do Macu; a textura visível vem do <rect
            fill="url(#esteira)"/> no svg, que é recortada na parede toda). */}
        <div
          ref={chaoRef}
          className="pointer-events-none absolute rounded-[50%]"
          style={{
            left: `${CHAO_ELIPSE.left}%`,
            top: `${CHAO_ELIPSE.top}%`,
            width: `${CHAO_ELIPSE.width}%`,
            height: `${CHAO_ELIPSE.height}%`,
          }}
        />

        {/* Fachada da Oca */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            {/* Textura de palha: tufos sobrepostos em 2 fileiras alternadas
                por tile, repetidos por todo o telhado — nada de linhas retas. */}
            <pattern id="palha" width={9} height={6.2} patternUnits="userSpaceOnUse">
              <rect width={9} height={6.2} fill={`#${COR_TELHADO}`} />
              {[0, 4.5].map((deslocX, linha) => (
                <g key={linha} transform={`translate(${deslocX}, ${linha * 3.1})`}>
                  <path
                    d="M -1.2 6.2 Q 0 0.6 1.2 6.2 Z"
                    fill={`#${sombrear(COR_TELHADO, linha === 0 ? 0.12 : 0.24)}`}
                  />
                  <path
                    d="M 3.3 6.2 Q 4.5 0.2 5.7 6.2 Z"
                    fill={`#${sombrear(COR_TELHADO, linha === 0 ? 0.2 : 0.08)}`}
                  />
                  <path d="M -1.2 6.2 Q 0 0.6 1.2 6.2" fill="none" stroke={`#${sombrear(COR_TELHADO, 0.42)}`} strokeWidth={0.18} />
                  <path d="M 3.3 6.2 Q 4.5 0.2 5.7 6.2" fill="none" stroke={`#${sombrear(COR_TELHADO, 0.42)}`} strokeWidth={0.18} />
                </g>
              ))}
            </pattern>
            {/* Piso interno: faixas horizontais (palha entrelaçada
                deitada/terra batida) — propositalmente diferente do
                trançado diagonal da parede, pra dar pra distinguir "isso é
                parede" de "isso é chão" só pela textura. */}
            <pattern id="chaoTextura" width={9} height={3.4} patternUnits="userSpaceOnUse">
              <rect width={9} height={3.4} fill={`#${decoracao.cor_chao}`} />
              <rect y={0} width={9} height={1.5} fill={`#${sombrear(decoracao.cor_chao, 0.14)}`} />
              <rect y={1.7} width={9} height={1.5} fill={`#${sombrear(decoracao.cor_chao, 0.04)}`} />
              <circle cx={1.8} cy={0.8} r={0.3} fill={`#${sombrear(decoracao.cor_chao, 0.4)}`} opacity={0.5} />
              <circle cx={5.6} cy={2.4} r={0.26} fill={`#${sombrear(decoracao.cor_chao, 0.35)}`} opacity={0.45} />
              <circle cx={7.6} cy={1.1} r={0.22} fill={`#${sombrear(decoracao.cor_chao, 0.45)}`} opacity={0.5} />
            </pattern>
            <clipPath id="areaChao">
              <ellipse cx={SOMBRA_OKA.cx} cy={SOMBRA_OKA.cy} rx={SOMBRA_OKA.rx} ry={SOMBRA_OKA.ry} />
            </clipPath>
          </defs>

          {/* parede: contorno curvo (planta elíptica), com um fundo marrom
              clarinho — dá a sensação de estar olhando ATRAVÉS dela (tipo
              vidro fumê), sem esconder o interior (efeito dollhouse) */}
          <path
            d={CAMINHO_PAREDE}
            fill={`#${decoracao.cor_parede}`}
            fillOpacity={0.28}
            stroke={`#${sombrear(decoracao.cor_parede, 0.4)}`}
            strokeWidth={0.7}
          />

          {/* porta: arco escuro sólido, como se fosse a parede do fundo lá
              dentro — dá profundidade em vez de brilhar/ficar vazado */}
          <path
            d={`M ${PORTA_ESQ_X} ${CHAO_Y} L ${PORTA_ESQ_X} ${PORTA_TOPO_Y + 6} Q ${PORTA_ESQ_X} ${PORTA_TOPO_Y} 50 ${PORTA_TOPO_Y} Q ${PORTA_DIR_X} ${PORTA_TOPO_Y} ${PORTA_DIR_X} ${PORTA_TOPO_Y + 6} L ${PORTA_DIR_X} ${CHAO_Y} Z`}
            fill={`#${sombrear(decoracao.cor_parede, 0.55)}`}
            stroke={`#${sombrear(decoracao.cor_parede, 0.5)}`}
            strokeWidth={0.7}
          />

          {/* sombra + chão da Oka (SOMBRA_OKA), desenhados por CIMA da
              parede/porta: na altura do chão não tem parede de verdade (é
              só o vão da porta ali), então a elipse do piso aparece por
              cima em vez de ficar escondida atrás do preenchimento da porta. */}
          <ellipse cx={SOMBRA_OKA.cx} cy={SOMBRA_OKA.cy} rx={SOMBRA_OKA.rx} ry={SOMBRA_OKA.ry} fill="rgba(0,0,0,0.18)" />
          <g clipPath="url(#areaChao)">
            <rect x={0} y={0} width={100} height={100} fill="url(#chaoTextura)" opacity={0.65} />
          </g>

          {/* telhado (triângulo) com textura de palha em tufos */}
          <polygon
            points={`${APICE.x},${APICE.y} ${TELHADO_ESQ.x},${TELHADO_ESQ.y} ${TELHADO_DIR.x},${TELHADO_DIR.y}`}
            fill="url(#palha)"
            stroke={`#${sombrear(COR_TELHADO, 0.3)}`}
            strokeWidth={0.6}
          />
          {/* sombra lateral direita do telhado, pra dar volume sobre a textura */}
          <polygon
            points={`${APICE.x},${APICE.y} ${pontoNoMeio(TELHADO_ESQ, TELHADO_DIR, 0.5).x},${pontoNoMeio(TELHADO_ESQ, TELHADO_DIR, 0.5).y} ${TELHADO_DIR.x},${TELHADO_DIR.y}`}
            fill={`#${sombrear(COR_TELHADO, 0.3)}`}
            opacity={0.35}
          />
          {/* beiral: linha mais escura marcando a borda inferior do telhado */}
          <polyline
            points={`${TELHADO_ESQ.x},${TELHADO_ESQ.y} ${TELHADO_DIR.x},${TELHADO_DIR.y}`}
            fill="none"
            stroke={`#${sombrear(COR_TELHADO, 0.5)}`}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {itemInfo.valor !== 'nenhum' && (
          <div className="absolute -translate-x-1/2" style={{ top: '80%', left: '58%' }}>
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

        {/* Macu: entra andando livre pelo chão interno (elipse = chaoRef),
            clique em qualquer ponto da cena pra caminhar até lá — mesma
            técnica de clamp elíptico do MacuNaIlha, só que sem árvore. */}
        <MacuNaOka
          ref={macuRef}
          config={config}
          cenaRef={cenaRef}
          chaoRef={chaoRef}
          userId={usuario?.id ?? null}
          tamanho={104}
        />
      </div>

      {/* Cabeçalho */}
      <div className="absolute left-1/2 top-6 z-30 -translate-x-1/2 text-center">
        <h1 className="text-2xl font-bold text-text drop-shadow-sm sm:text-3xl">Oka</h1>
        <p className="text-sm font-medium text-text/80 drop-shadow-sm">Uma extensão do seu Macu</p>
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

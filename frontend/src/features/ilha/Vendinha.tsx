interface VendinhaProps {
  escala?: number
  // Sem essa prop o objeto fica só decorativo — mesma convenção do
  // onClickQuadro em Cavalete.tsx.
  onClick?: (evento: React.MouseEvent) => void
}

const LISTRAS_TOLDO = ['#c4603a', '#f7f1e3', '#c4603a', '#f7f1e3', '#c4603a']

/** Barraquinha da vendinha — postes + toldo listrado + balcão, mesma
 * linguagem visual plana (sem emoji) de Fogueira.tsx/Cavalete.tsx. */
export function Vendinha({ escala = 1, onClick }: VendinhaProps) {
  return (
    <div
      className="absolute z-[1]"
      style={{ left: '38%', top: '68%', width: 64, height: 58, transform: `translate(-50%, -50%) scale(${escala})` }}
    >
      {/* postes */}
      <span className="absolute rounded-sm bg-[#6b5238]" style={{ left: 4, top: 10, width: 5, height: 42 }} />
      <span className="absolute rounded-sm bg-[#6b5238]" style={{ right: 4, top: 10, width: 5, height: 42 }} />

      {/* toldo listrado (triangular, tipo tenda) */}
      <svg className="absolute" style={{ left: 0, top: 0, width: 64, height: 26 }} viewBox="0 0 64 26">
        {LISTRAS_TOLDO.map((cor, i) => (
          <polygon key={i} points={`${i * 12.8},2 ${(i + 1) * 12.8},2 ${(i + 1) * 12.8 - 4},22 ${i * 12.8 + 4},22`} fill={cor} />
        ))}
        <rect x={0} y={0} width={64} height={4} fill="#5c4530" />
      </svg>

      {/* balcão */}
      <div
        className={`absolute rounded-[3px] shadow-sm ${onClick ? 'cursor-pointer' : ''}`}
        style={{ left: 2, top: 34, width: 60, height: 20, background: '#8a6a4a' }}
        onClick={onClick}
      >
        <div className="absolute rounded-[2px] bg-[#a9835c]" style={{ inset: '2px 2px 8px 2px' }} />
        {/* mercadorias no balcão, formas planas só pra dar vida */}
        <span className="absolute rounded-full bg-[#c4603a]" style={{ left: 8, top: 4, width: 8, height: 8 }} />
        <span className="absolute rounded-full bg-[#4f7a6b]" style={{ left: 22, top: 4, width: 8, height: 8 }} />
        <span className="absolute rounded-full bg-[#e0784f]" style={{ left: 36, top: 4, width: 8, height: 8 }} />
      </div>
    </div>
  )
}

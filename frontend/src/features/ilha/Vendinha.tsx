interface VendinhaProps {
  escala?: number
  // Sem essa prop o objeto fica só decorativo — mesma convenção do
  // onClickQuadro em Cavalete.tsx.
  onClick?: (evento: React.MouseEvent) => void
}

/** Barraquinha da vendinha — um alpendre visto de lado (poste da frente
 * mais alto/grosso, o de trás mais curto e apagado, sugerindo profundidade)
 * com um único painel de toldo inclinado, em vez da tenda simétrica de
 * frente de antes (lia como "tenda de festa"). Fica meio de lado no canto
 * ESQUERDO da ilha, com uma leve inclinação — não de frente pro jogador,
 * mas assentada por inteiro na grama (não pendurada na borda da areia).
 * Espelhada (scaleX(-1)) em cima do mesmo desenho do canto direito, pra
 * não duplicar a marcação de cada forma. */
export function Vendinha({ escala = 1, onClick }: VendinhaProps) {
  return (
    <div
      className="absolute z-[1]"
      style={{
        left: '28%',
        top: '50%',
        width: 58,
        height: 54,
        transform: `translate(-50%, -50%) scaleX(-1) scale(${escala})`,
      }}
    >
      {/* poste de trás — mais curto e apagado, sugere distância */}
      <span className="absolute rounded-sm bg-[#6b5238] opacity-70" style={{ left: 2, top: 18, width: 4, height: 30 }} />
      {/* poste da frente */}
      <span className="absolute rounded-sm bg-[#5c4530]" style={{ right: 8, top: 4, width: 5, height: 44 }} />

      {/* toldo — painel inclinado único (alpendre), não tenda simétrica */}
      <div
        className="absolute origin-top-left bg-[#5c4530]"
        style={{ left: 2, top: 2, width: 50, height: 5, transform: 'skewY(-8deg)' }}
      />
      <div
        className="absolute origin-top-left bg-[#c4603a] shadow-sm"
        style={{ left: 2, top: 7, width: 50, height: 13, transform: 'skewY(-8deg)' }}
      />

      {/* balcão, com face lateral escura pra dar volume */}
      <div
        className={`absolute rounded-[2px] ${onClick ? 'cursor-pointer' : ''}`}
        style={{ left: 4, top: 30, width: 44, height: 18, background: '#8a6a4a' }}
        onClick={onClick}
      >
        <div className="absolute rounded-[1px] bg-[#a9835c]" style={{ inset: '2px 2px 9px 2px' }} />
      </div>
      <span className="absolute rounded-[1px] bg-[#6b5238]" style={{ left: 48, top: 32, width: 4, height: 16 }} />

      {/* mercadoria discreta no balcão */}
      <span className="absolute rounded-[1px] bg-[#4f7a6b]" style={{ left: 12, top: 24, width: 7, height: 7 }} />
      <span className="absolute rounded-full bg-[#e0784f]" style={{ left: 24, top: 25, width: 6, height: 6 }} />
    </div>
  )
}

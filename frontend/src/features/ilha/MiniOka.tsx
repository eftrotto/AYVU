interface MiniOkaProps {
  corParede?: string
  escala?: number
  onClick?: (evento: React.MouseEvent) => void
}

const COR_TELHADO = '9c7b3f'

/** Miniatura clicável da Oka pessoal do aluno, na própria ilha — mesma
 * linguagem visual plana de Fogueira.tsx/Cavalete.tsx/Vendinha.tsx. Fica no
 * fundo da cena (menor, mais pro alto — "mais longe" — e com z-index menor
 * que a fogueira), deslocada pro lado dela em vez de bem atrás: as duas têm
 * pegada grande demais pro tamanho da ilha pra empilhar no mesmo ponto sem
 * parecer que uma está em cima da outra. Reflete a cor de parede escolhida
 * na Vendinha (ver ocaData.ts), pra reforçar visualmente a ligação entre
 * comprar lá e ver o resultado aqui. */
export function MiniOka({ corParede = 'c2a35f', escala = 1, onClick }: MiniOkaProps) {
  return (
    <div
      className={`absolute z-0 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ left: '72%', top: '18%', width: 38, height: 42, transform: `translate(-50%, -50%) scale(${escala})` }}
      onClick={onClick}
    >
      {/* telhado triangular de palha */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          borderLeft: '19px solid transparent',
          borderRight: '19px solid transparent',
          borderBottom: `18px solid #${COR_TELHADO}`,
        }}
      />
      <span className="absolute rounded-full" style={{ left: 2, top: 15, width: 34, height: 2, background: '#7a6134' }} />

      {/* parede, na cor comprada/escolhida na Vendinha */}
      <div className="absolute rounded-b-[3px]" style={{ left: 5, top: 17, width: 29, height: 21, background: `#${corParede}` }} />
      {/* porta */}
      <div className="absolute rounded-t-full" style={{ left: 14, top: 24, width: 9, height: 14, background: '#33261a' }} />
    </div>
  )
}

interface Opcao {
  valor: string
  hex: string
  rotulo?: string
}

interface SwatchRowProps {
  opcoes: readonly Opcao[]
  valorSelecionado: string
  aoSelecionar: (valor: string) => void
}

export function SwatchRow({ opcoes, valorSelecionado, aoSelecionar }: SwatchRowProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          title={opcao.rotulo ?? `#${opcao.hex}`}
          aria-label={opcao.rotulo ?? `#${opcao.hex}`}
          onClick={() => aoSelecionar(opcao.valor)}
          className={`h-8 w-8 rounded-full border-2 border-white shadow-[0_0_0_1.5px_var(--color-border)] transition-transform hover:-translate-y-0.5 ${
            valorSelecionado === opcao.valor ? 'shadow-[0_0_0_2.5px_var(--color-accent)]' : ''
          }`}
          style={{ backgroundColor: `#${opcao.hex}` }}
        />
      ))}
    </div>
  )
}

import type { MacuAvatarConfig } from '../../types/api'
import { LPC_CELL, LPC_FRAME_COL, LPC_FRAME_ROW, LPC_SHEET_COLS, ORDEM_DAS_CAMADAS, caminhoDaCamada } from './lpcData'

interface AvatarStageProps {
  config: MacuAvatarConfig
  tamanho?: number // px do lado do palco (um "quadro" de sprite)
  className?: string
  linha?: number // linha da spritesheet (10 = em pé, 32 = sentado, 28 = pulando...)
  coluna?: number
  comMoldura?: boolean // fundo/borda arredondada (telas do Macu) — desliga pra usar solto numa cena (Ayvu)
}

/**
 * Composição do boneco via CSS puro (sem <canvas>): cada camada é a mesma
 * spritesheet LPC inteira, escalada e deslocada pra mostrar um quadro fixo.
 * Por padrão mostra "parado, de frente" (linha 10) — outras poses (sentado,
 * pulando) reaproveitam as MESMAS spritesheets já baixadas, só mudando
 * linha/coluna (ver LAYOUT_LPC em lagoa/animacoes.ts).
 */
export function AvatarStage({
  config,
  tamanho = 320,
  className = '',
  linha = LPC_FRAME_ROW,
  coluna = LPC_FRAME_COL,
  comMoldura = true,
}: AvatarStageProps) {
  const larguraDaFolha = tamanho * LPC_SHEET_COLS
  const escala = tamanho / LPC_CELL
  const deslocamentoY = -(linha * LPC_CELL * escala)
  const deslocamentoX = -(coluna * LPC_CELL * escala)

  return (
    <div
      className={`relative overflow-hidden ${comMoldura ? 'rounded-2xl border-4 border-white shadow-warm' : ''} ${className}`}
      style={{
        width: tamanho,
        height: tamanho,
        background: comMoldura ? 'linear-gradient(160deg, #ffe4cf, #fbeee0)' : undefined,
      }}
    >
      {ORDEM_DAS_CAMADAS.map((camada) => (
        <div
          key={camada}
          className="pixelated absolute inset-0"
          style={{
            backgroundImage: `url("${caminhoDaCamada(camada, config)}")`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${larguraDaFolha}px auto`,
            backgroundPosition: `${deslocamentoX}px ${deslocamentoY}px`,
          }}
        />
      ))}
    </div>
  )
}

import type { MacuAvatarConfig } from '../../types/api'
import { LPC_CELL, LPC_FRAME_ROW, LPC_SHEET_COLS, ORDEM_DAS_CAMADAS, caminhoDaCamada } from './lpcData'

interface AvatarStageProps {
  config: MacuAvatarConfig
  tamanho?: number // px do lado do palco (um "quadro" de sprite)
  className?: string
}

/**
 * Composição do boneco via CSS puro (sem <canvas>): cada camada é a mesma
 * spritesheet LPC inteira, escalada e deslocada pra sempre mostrar o mesmo
 * quadro fixo (linha 10, coluna 0 = "parado, de frente").
 */
export function AvatarStage({ config, tamanho = 320, className = '' }: AvatarStageProps) {
  const larguraDaFolha = tamanho * LPC_SHEET_COLS
  const deslocamentoY = -(LPC_FRAME_ROW * LPC_CELL * (tamanho / LPC_CELL))

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-4 border-white shadow-warm ${className}`}
      style={{
        width: tamanho,
        height: tamanho,
        background: 'linear-gradient(160deg, #ffe4cf, #fbeee0)',
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
            backgroundPosition: `0 ${deslocamentoY}px`,
          }}
        />
      ))}
    </div>
  )
}

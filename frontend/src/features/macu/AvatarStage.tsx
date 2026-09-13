import { useEffect, useRef } from 'react'
import type { MacuAvatarConfig } from '../../types/api'
import {
  LPC_CELL,
  LPC_FRAME_COL,
  LPC_FRAME_ROW,
  ORDEM_DAS_CAMADAS,
  TONS_DE_PELE,
  caminhoDaCamada,
} from './lpcData'

// Elipse (coordenadas nativas de 64px) que cobre o "buraco" entre o fim do
// cabelo e o começo do corpo na pose "parado de frente" (linha 10) — ver
// comentário mais abaixo. Ajustada pra caber dentro do contorno da cabeça
// em qualquer estilo de cabelo (não vaza pros lados/topo).
const ROSTO_ELIPSE = { cx: 32, cy: 27, rx: 10, ry: 9 }

interface AvatarStageProps {
  config: MacuAvatarConfig
  tamanho?: number // px do lado do palco (um "quadro" de sprite)
  className?: string
  linha?: number // linha da spritesheet (10 = em pé, 32 = sentado, 28 = pulando...)
  coluna?: number
  comMoldura?: boolean // fundo/borda arredondada (telas do Macu) — desliga pra usar solto numa cena (Ayvu)
}

const cacheDeImagens = new Map<string, HTMLImageElement>()

function carregarImagem(url: string): Promise<HTMLImageElement> {
  const existente = cacheDeImagens.get(url)

  // Um <img> recém-criado, SEM src, já vem com `complete === true` (não há
  // nada pra carregar ainda) — checar `complete` antes de setar `src`
  // resolvia a promise na hora com uma imagem em branco, sem nunca
  // carregar nada de verdade. Por isso `src` é setado antes de qualquer
  // checagem de estado.
  if (existente) {
    if (existente.complete) return Promise.resolve(existente)
    return new Promise((resolve) => {
      existente.addEventListener('load', () => resolve(existente), { once: true })
      existente.addEventListener('error', () => resolve(existente), { once: true })
    })
  }

  const img = new Image()
  cacheDeImagens.set(url, img)
  return new Promise((resolve) => {
    img.onload = () => resolve(img)
    img.onerror = () => resolve(img) // desenha o que der; não trava a cena por 1 camada
    img.src = url
  })
}

/**
 * Composição do boneco via <canvas> (não CSS background-image empilhado):
 * cada camada é a mesma spritesheet LPC inteira, e desenhamos só o quadro
 * fixo (linha/coluna) de cada uma no canvas, na ordem certa.
 */
export function AvatarStage({
  config,
  tamanho = 320,
  className = '',
  linha = LPC_FRAME_ROW,
  coluna = LPC_FRAME_COL,
  comMoldura = true,
}: AvatarStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const urls = ORDEM_DAS_CAMADAS.map((camada) => caminhoDaCamada(camada, config))
  const chaveDasUrls = urls.join('|')

  useEffect(() => {
    let cancelado = false
    const canvas = canvasRef.current
    if (!canvas) return undefined

    Promise.all(urls.map(carregarImagem)).then((imagens) => {
      if (cancelado) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, tamanho, tamanho)

      // Base da cor de pele por trás da testa: a sprite do corpo não
      // desenha nada acima do queixo (espera o cabelo cobrir 100%), mas o
      // desenho do cabelo tem uma frestinha de 1-3px entre o fim dele e o
      // começo do corpo (visível em QUALQUER estilo, mais forte em fundos
      // escuros). Preenchendo essa faixa com a cor de pele antes das
      // camadas reais, a frestinha mostra "pele" em vez do fundo da cena.
      const escala = tamanho / LPC_CELL
      const tomDePele = TONS_DE_PELE.find((t) => t.valor === config.skinTone)?.hex
      if (tomDePele) {
        ctx.fillStyle = `#${tomDePele}`
        ctx.beginPath()
        ctx.ellipse(
          ROSTO_ELIPSE.cx * escala,
          ROSTO_ELIPSE.cy * escala,
          ROSTO_ELIPSE.rx * escala,
          ROSTO_ELIPSE.ry * escala,
          0,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }

      for (const img of imagens) {
        if (!img.naturalWidth) continue // camada que falhou ao carregar: pula
        ctx.drawImage(
          img,
          coluna * LPC_CELL,
          linha * LPC_CELL,
          LPC_CELL,
          LPC_CELL,
          0,
          0,
          tamanho,
          tamanho,
        )
      }
    })

    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveDasUrls, tamanho, linha, coluna])

  return (
    <div
      className={`relative overflow-hidden ${comMoldura ? 'rounded-2xl border-4 border-white shadow-warm' : ''} ${className}`}
      style={{
        width: tamanho,
        height: tamanho,
        background: comMoldura ? 'linear-gradient(160deg, #ffe4cf, #fbeee0)' : undefined,
      }}
    >
      <canvas ref={canvasRef} width={tamanho} height={tamanho} className="pixelated absolute inset-0" />
    </div>
  )
}

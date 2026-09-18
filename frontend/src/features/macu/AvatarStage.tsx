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

// Cobre o "buraco" entre cabelo e corpo na pose "parado de frente" (ver
// comentário mais abaixo). Coordenadas nativas de 64px.
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

  // Um <img> recém-criado, SEM src, já vem com `complete === true` — checar
  // isso antes de setar `src` resolvia a promise na hora com imagem em branco.
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

      // A sprite do corpo não desenha nada acima do queixo (espera o cabelo
      // cobrir 100%), mas todo estilo de cabelo tem uma frestinha de 1-3px
      // ali — preenchendo com a cor de pele antes das camadas reais, a
      // frestinha mostra "pele" em vez do fundo da cena.
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

      // Óculos de sol — acessório comprável na vendinha, não é uma camada
      // LPC (não existe esse sprite no catálogo), então é desenhado por
      // cima igual os adornos do pajé (ver PajeStage.tsx): só de frente
      // (linha === LPC_FRAME_ROW), porque a posição dos olhos muda de
      // lugar nas outras direções e não tem como acompanhar sem o mesmo
      // trabalho de "só de frente" já usado lá.
      if (config.usaOculos && linha === LPC_FRAME_ROW) {
        const larguraLente = 6.2
        const alturaLente = 4.6
        const raio = 1.6
        const centroY = 26.5
        ctx.fillStyle = '#20201f'
        for (const cx of [28.3, 35.7]) {
          ctx.beginPath()
          ctx.roundRect(
            (cx - larguraLente / 2) * escala,
            (centroY - alturaLente / 2) * escala,
            larguraLente * escala,
            alturaLente * escala,
            raio * escala,
          )
          ctx.fill()
        }
        ctx.fillRect(31.2 * escala, (centroY - 0.7) * escala, 1.6 * escala, 1.4 * escala) // ponte
        ctx.fillStyle = 'rgba(255,255,255,0.25)'
        for (const cx of [27, 34.4]) {
          ctx.beginPath()
          ctx.roundRect(cx * escala, (centroY - 1.4) * escala, 1.6 * escala, 1 * escala, 0.5 * escala)
          ctx.fill()
        }
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

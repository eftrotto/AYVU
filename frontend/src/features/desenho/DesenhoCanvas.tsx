import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

export interface DesenhoCanvasHandle {
  exportarPng: () => string
  limpar: () => void
}

interface DesenhoCanvasProps {
  // Desliga os handlers de desenho (desafio já enviado/expirado) sem
  // desmontar o canvas — o desenho final continua visível.
  bloqueado?: boolean
  largura?: number
  altura?: number
}

// Resolução fixa e modesta: mantém o PNG exportado pequeno (a imagem vai
// como base64 direto numa coluna Text — ver backend/app/models.py), sem
// precisar de Storage.
const LARGURA_PADRAO = 480
const ALTURA_PADRAO = 360

const ESPESSURA_PINCEL = 5
const ESPESSURA_BORRACHA = 24

const PALETA = ['#2c1c12', '#c1442c', '#f0b429', '#3f7d3f', '#3a7ca5', '#7c3aed', '#e07b39', '#ffffff']

/**
 * Canvas de desenho simples — pincel com cor, borracha e limpar, via
 * Pointer Events nativos (sem lib). O "desenho" vive só no bitmap do
 * canvas (sem histórico de traços), então exportar é só um toDataURL.
 */
export const DesenhoCanvas = forwardRef<DesenhoCanvasHandle, DesenhoCanvasProps>(function DesenhoCanvas(
  { bloqueado = false, largura = LARGURA_PADRAO, altura = ALTURA_PADRAO },
  refExterno,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const desenhandoRef = useRef(false)
  const ultimoPontoRef = useRef<{ x: number; y: number } | null>(null)
  const [cor, setCor] = useState(PALETA[0])
  const [borracha, setBorracha] = useState(false)

  const limpar = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Fundo branco desde o início — sem isso o PNG exportado sai com fundo
  // transparente, e a borracha (que só "pinta de branco") não teria efeito.
  useEffect(() => {
    limpar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function posicaoNoCanvas(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  function desenharPonto(ponto: { x: number; y: number }) {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = borracha ? '#ffffff' : cor
    ctx.beginPath()
    ctx.arc(ponto.x, ponto.y, (borracha ? ESPESSURA_BORRACHA : ESPESSURA_PINCEL) / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  function aoPressionar(e: React.PointerEvent<HTMLCanvasElement>) {
    if (bloqueado) return
    canvasRef.current?.setPointerCapture(e.pointerId)
    desenhandoRef.current = true
    const ponto = posicaoNoCanvas(e)
    ultimoPontoRef.current = ponto
    desenharPonto(ponto)
  }

  function aoMover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (bloqueado || !desenhandoRef.current) return
    const ponto = posicaoNoCanvas(e)
    const ctx = canvasRef.current?.getContext('2d')
    const anterior = ultimoPontoRef.current
    if (ctx && anterior) {
      ctx.strokeStyle = borracha ? '#ffffff' : cor
      ctx.lineWidth = borracha ? ESPESSURA_BORRACHA : ESPESSURA_PINCEL
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(anterior.x, anterior.y)
      ctx.lineTo(ponto.x, ponto.y)
      ctx.stroke()
    }
    ultimoPontoRef.current = ponto
  }

  function aoSoltar() {
    desenhandoRef.current = false
    ultimoPontoRef.current = null
  }

  useImperativeHandle(refExterno, () => ({
    exportarPng: () => canvasRef.current?.toDataURL('image/png') ?? '',
    limpar,
  }))

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        width={largura}
        height={altura}
        className={`w-full touch-none rounded-2xl border-2 border-border bg-white shadow-inner ${
          bloqueado ? 'opacity-70' : 'cursor-crosshair'
        }`}
        style={{ aspectRatio: `${largura} / ${altura}` }}
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerLeave={aoSoltar}
      />

      {!bloqueado && (
        <div className="flex flex-wrap items-center gap-2">
          {PALETA.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCor(c)
                setBorracha(false)
              }}
              className={`h-7 w-7 rounded-full border-2 transition-transform ${
                !borracha && cor === c ? 'scale-110 border-accent' : 'border-white/70'
              }`}
              style={{ background: c, boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px #ddd' : undefined }}
              aria-label={`Cor ${c}`}
            />
          ))}
          <button
            type="button"
            onClick={() => setBorracha(true)}
            className={`rounded-full border-2 px-3 py-1 text-xs font-bold ${
              borracha ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-card text-text-soft'
            }`}
          >
            🧼 Borracha
          </button>
          <button
            type="button"
            onClick={limpar}
            className="rounded-full border-2 border-border bg-card px-3 py-1 text-xs font-bold text-text-soft hover:border-erro hover:text-erro"
          >
            🗑️ Limpar
          </button>
        </div>
      )}
    </div>
  )
})

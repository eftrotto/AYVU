import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import type { Conteudo } from '../../../types/api'

const CHAVE_RESPOSTAS = 'ayvu_desafios_respostas'

function obterRespostaLocal(conteudoId: number): string {
  const todas = JSON.parse(localStorage.getItem(CHAVE_RESPOSTAS) || '{}')
  return todas[conteudoId] ?? ''
}

function salvarRespostaLocal(conteudoId: number, texto: string): void {
  const todas = JSON.parse(localStorage.getItem(CHAVE_RESPOSTAS) || '{}')
  todas[conteudoId] = texto
  localStorage.setItem(CHAVE_RESPOSTAS, JSON.stringify(todas))
}

interface DesafioViewerProps {
  conteudo: Conteudo
  jaConcluido: boolean
  aoConcluir: () => void
}

/**
 * O backend só registra "concluído" (ver models.ProgressoAluno) — não há
 * coluna pra guardar o texto do desafio no servidor, isso não fazia parte
 * do modelo de dados pedido. O texto fica só neste dispositivo por
 * enquanto (localStorage); se precisar ir pro servidor no futuro, o
 * modelo `ProgressoAluno` vai precisar de uma coluna de texto.
 */
export function DesafioViewer({ conteudo, jaConcluido, aoConcluir }: DesafioViewerProps) {
  const [resposta, setResposta] = useState(() => obterRespostaLocal(conteudo.id))
  const [salvo, setSalvo] = useState(jaConcluido)

  function salvar() {
    salvarRespostaLocal(conteudo.id, resposta)
    setSalvo(true)
    aoConcluir()
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[0.98rem] leading-relaxed text-text">{conteudo.corpo_ou_url}</p>

      <textarea
        value={resposta}
        onChange={(e) => {
          setResposta(e.target.value)
          setSalvo(false)
        }}
        rows={5}
        placeholder="Escreva aqui o que você fez ou descobriu..."
        className="rounded-2xl border border-border bg-[#fffaf3] p-4 text-sm text-text outline-none focus:border-accent"
      />

      <Button onClick={salvar} className="self-start">
        {salvo ? '✓ Resposta salva' : 'Salvar minha resposta'}
      </Button>
    </div>
  )
}

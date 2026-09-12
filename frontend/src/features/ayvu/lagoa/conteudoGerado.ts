/**
 * Conteúdo da tela de exploração do tema.
 *
 * Este protótipo prioriza o FLUXO (busca -> gota -> mergulho -> como
 * estudar -> exploração), não a geração de conteúdo em si — a pesquisa é
 * texto livre ("qualquer tema, dentro ou fora do currículo"), então não dá
 * pra vir de uma tabela fixa de temas curados como o Ayvu original tinha.
 *
 * Por isso o conteúdo abaixo é gerado localmente a partir do termo
 * pesquisado, só pra preencher a tela de forma coerente na demo. O próximo
 * passo natural (fora do escopo deste protótipo) é trocar isso por uma
 * chamada real de backend — provavelmente um endpoint que gera conteúdo
 * sob demanda (ex.: via LLM) a partir do termo + modo escolhido.
 */
import type { Modo } from './modos'

export interface ConteudoDoTema {
  titulo: string
  introducao: string
  conceitosRelacionados: string[]
  perguntas: string[]
  curiosidades: string[]
  atividades: string[]
  recomendacoes: string[]
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

const INTRODUCOES_POR_MODO: Record<string, string> = {
  entender: 'Uma explicação direta pra você sair daqui com o essencial sobre',
  assistir: 'Uma seleção pensada pra quem aprende melhor vendo e ouvindo sobre',
  praticar: 'Um espaço pra colocar a mão na massa e praticar',
  conversar: 'Um lugar pra tirar dúvidas e trocar ideia sobre',
  testar: 'Um jeito rápido de ver o que você já sabe sobre',
  explorar: 'Um convite pra vagar sem pressa por',
  criar: 'Um ponto de partida pra você produzir algo a partir de',
}

export function gerarConteudoDoTema(termo: string, modo: Modo): ConteudoDoTema {
  const tema = capitalizar(termo.trim())
  const introBase = INTRODUCOES_POR_MODO[modo.chave] ?? 'Um mergulho em'

  return {
    titulo: tema,
    introducao: `${introBase} ${termo}. Sem prova, sem pressa — só o seu ritmo de curiosidade.`,
    conceitosRelacionados: [
      `Origem e contexto de ${termo}`,
      `Como ${termo} se conecta com o que você já sabe`,
      `Onde ${termo} aparece no dia a dia`,
      `Ideias parecidas que valem explorar depois`,
    ],
    perguntas: [
      `O que te fez pensar em ${termo} hoje?`,
      `Se você tivesse que explicar ${termo} pra alguém em 1 minuto, o que diria?`,
      `Existe algo sobre ${termo} que te deixa em dúvida ainda?`,
    ],
    curiosidades: [
      `${tema} costuma surpreender quem olha de perto pela primeira vez.`,
      `Muita gente descobre ${termo} por acaso, não na escola.`,
      `${tema} tem mais camadas do que parece à primeira vista.`,
    ],
    atividades: [
      `Escreva 3 frases sobre ${termo} com suas próprias palavras.`,
      `Procure um exemplo de ${termo} na sua rotina e registre o que notou.`,
      `Explique ${termo} pra alguém e veja que pergunta essa pessoa faz de volta.`,
    ],
    recomendacoes: [`${tema}: para iniciantes`, `Histórias por trás de ${termo}`, `${tema} na prática`],
  }
}

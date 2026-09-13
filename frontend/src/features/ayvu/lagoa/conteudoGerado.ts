// Conteúdo gerado localmente a partir do termo pesquisado (texto livre, sem
// tabela fixa de temas curados) — placeholder de demo. Próximo passo natural
// é trocar por uma chamada de backend (ex.: LLM) a partir de termo + modo.
import type { ModoChave } from './modos'

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

interface Base {
  titulo: string
  introducao: string
}

export interface ConteudoEntender extends Base {
  tipo: 'entender'
  explicacao: string
  conceitosRelacionados: string[]
}

export interface ConteudoAssistir extends Base {
  tipo: 'assistir'
  // Os vídeos em si vêm de uma busca real no YouTube (ayvuApi.buscarVideos), não daqui.
  dicaDeAtencao: string
}

export interface ConteudoPraticar extends Base {
  tipo: 'praticar'
  exercicios: string[]
}

export interface ConteudoConversar extends Base {
  tipo: 'conversar'
  perguntasAbertas: string[]
  comQuemConversar: string[]
}

export interface PerguntaAutoavaliacao {
  chave: string
  pergunta: string
}

export interface ConteudoTestar extends Base {
  tipo: 'testar'
  // Autoavaliação, não prova: sem resposta certa, mede familiaridade e recomenda o próximo modo.
  perguntas: PerguntaAutoavaliacao[]
}

export interface ConteudoExplorar extends Base {
  tipo: 'explorar'
  curiosidades: string[]
  caminhosInesperados: string[]
}

export interface ConteudoCriar extends Base {
  tipo: 'criar'
  ideias: string[]
}

export type ConteudoDoTema =
  | ConteudoEntender
  | ConteudoAssistir
  | ConteudoPraticar
  | ConteudoConversar
  | ConteudoTestar
  | ConteudoExplorar
  | ConteudoCriar

export function gerarConteudoDoTema(termo: string, modo: ModoChave): ConteudoDoTema {
  const t = termo.trim()
  const tema = capitalizar(t)

  switch (modo) {
    case 'entender':
      return {
        tipo: 'entender',
        titulo: tema,
        introducao: `Uma explicação direta pra você sair daqui com o essencial sobre ${t}.`,
        explicacao: `${tema} é um assunto que costuma fazer mais sentido quando você conecta com algo que já conhece. Comece pelo básico: o que ${t} é, de onde vem, e por que alguém se importaria com isso — o resto vem depois, no seu ritmo.`,
        conceitosRelacionados: [
          `Origem e contexto de ${t}`,
          `Como ${t} se conecta com o que você já sabe`,
          `Onde ${t} aparece no dia a dia`,
        ],
      }

    case 'assistir':
      return {
        tipo: 'assistir',
        titulo: tema,
        introducao: `Uma seleção pensada pra quem aprende melhor vendo e ouvindo sobre ${t}.`,
        dicaDeAtencao: `Enquanto assiste, repare em que momento ${t} deixa de ser abstrato e vira algo concreto pra você.`,
      }

    case 'praticar':
      return {
        tipo: 'praticar',
        titulo: tema,
        introducao: `Um espaço pra colocar a mão na massa e praticar ${t}.`,
        exercicios: [
          `Escreva 3 frases sobre ${t} com suas próprias palavras.`,
          `Procure um exemplo de ${t} na sua rotina e registre o que notou.`,
          `Resuma ${t} como se fosse explicar num post de rede social.`,
        ],
      }

    case 'conversar':
      return {
        tipo: 'conversar',
        titulo: tema,
        introducao: `Um lugar pra tirar dúvidas e trocar ideia sobre ${t}.`,
        perguntasAbertas: [
          `O que te fez pensar em ${t} hoje?`,
          `Existe algo sobre ${t} que te deixa em dúvida ainda?`,
          `Se pudesse perguntar uma coisa sobre ${t} pra um especialista, o que seria?`,
        ],
        comQuemConversar: [
          `Um colega que também se interessa por ${t}`,
          'Alguém da sua família',
          'Um professor ou mentor',
        ],
      }

    case 'testar':
      return {
        tipo: 'testar',
        titulo: tema,
        introducao: `3 perguntas rápidas pra você perceber onde está com ${t} — sem nota, sem certo ou errado.`,
        perguntas: [
          { chave: 'origem', pergunta: `Você sabe de onde vem ${t}, ou como isso surgiu?` },
          { chave: 'explicar', pergunta: `Você consegue explicar ${t} pra alguém em poucas frases?` },
          { chave: 'dia_a_dia', pergunta: `Você reconhece ${t} quando aparece no seu dia a dia?` },
        ],
      }

    case 'explorar':
      return {
        tipo: 'explorar',
        titulo: tema,
        introducao: `Um convite pra vagar sem pressa por ${t}.`,
        curiosidades: [
          `${tema} costuma surpreender quem olha de perto pela primeira vez.`,
          `Muita gente descobre ${t} por acaso, não na escola.`,
          `${tema} tem mais camadas do que parece à primeira vista.`,
        ],
        caminhosInesperados: [
          `A história por trás de ${t}`,
          `Quem descobriu ou criou ${t}`,
          `Como ${t} mudou com o tempo`,
        ],
      }

    case 'criar':
      return {
        tipo: 'criar',
        titulo: tema,
        introducao: `Um ponto de partida pra você produzir algo a partir de ${t}.`,
        ideias: [
          `Desenhe ou esquematize ${t} do seu jeito.`,
          `Grave um áudio de 1 minuto explicando ${t} pra você do futuro.`,
          `Crie uma analogia própria pra explicar ${t} usando algo que você gosta.`,
        ],
      }
  }
}

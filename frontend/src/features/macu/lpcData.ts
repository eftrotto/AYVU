/**
 * Catálogo de opções do avatar (sprites LPC — Liberated Pixel Cup).
 * Curadoria e créditos completos em public/assets/lpc/CREDITS.md.
 */
import type { MacuAvatarConfig } from '../../types/api'

export const LPC_CELL = 64
export const LPC_FRAME_ROW = 10 // "parado, de frente" — mesmo quadro que o gerador original usa como preview
export const LPC_FRAME_COL = 0
export const LPC_SHEET_COLS = 13 // 832px / 64px

export const GENEROS = [
  { valor: 'male', rotulo: 'Base A' },
  { valor: 'female', rotulo: 'Base B' },
] as const

export const TONS_DE_PELE = [
  { valor: 'light', hex: 'faece7' },
  { valor: 'amber', hex: 'fbe7a4' },
  { valor: 'olive', hex: 'e4a47c' },
  { valor: 'taupe', hex: 'c7935f' },
  { valor: 'bronze', hex: 'd38b59' },
  { valor: 'brown', hex: 'b8773f' },
  { valor: 'black', hex: '7f4c31' },
] as const

export const ESTILOS_DE_CABELO = [
  { valor: 'plain', rotulo: 'Liso' },
  { valor: 'bangs', rotulo: 'Franja' },
  { valor: 'long', rotulo: 'Longo' },
  { valor: 'ponytail', rotulo: 'Rabo de cavalo' },
  { valor: 'afro', rotulo: 'Afro' },
] as const

export const CORES_DE_CABELO = [
  { valor: 'black', rotulo: 'Preto', hex: '4a5057' },
  { valor: 'dark_brown', rotulo: 'Castanho escuro', hex: '792806' },
  { valor: 'light_brown', rotulo: 'Castanho claro', hex: 'c88d58' },
  { valor: 'blonde', rotulo: 'Loiro', hex: 'ffe67d' },
  { valor: 'red', rotulo: 'Ruivo', hex: 'f1583a' },
  { valor: 'gray', rotulo: 'Grisalho', hex: 'd9d9d9' },
  { valor: 'white', rotulo: 'Branco', hex: 'd8dcdc' },
  { valor: 'blue', rotulo: 'Azul', hex: '1e85ef' },
] as const

export const ESTILOS_DE_SOBRANCELHA = [
  { valor: 'thick', rotulo: 'Grossa' },
  { valor: 'thin', rotulo: 'Fina' },
] as const

export const CORES_DE_OLHO = [
  { valor: 'blue', rotulo: 'Azul', hex: '50d4ec' },
  { valor: 'brown', rotulo: 'Castanho', hex: '7e4e20' },
  { valor: 'gray', rotulo: 'Cinza', hex: 'ada18f' },
  { valor: 'green', rotulo: 'Verde', hex: '84ec50' },
  { valor: 'orange', rotulo: 'Âmbar', hex: 'ea9b71' },
  { valor: 'purple', rotulo: 'Violeta', hex: 'eba0e0' },
  { valor: 'red', rotulo: 'Vermelho', hex: 'ff3d62' },
  { valor: 'yellow', rotulo: 'Amarelo', hex: 'fedf47' },
] as const

export const CORES_DE_ROUPA = [
  { valor: 'black', rotulo: 'Preto', hex: '4a5057' },
  { valor: 'navy', rotulo: 'Azul-marinho', hex: '466ac9' },
  { valor: 'gray', rotulo: 'Cinza', hex: 'a2a0a4' },
  { valor: 'brown', rotulo: 'Marrom', hex: '996b4a' },
  { valor: 'forest', rotulo: 'Verde', hex: '1b5502' },
  { valor: 'maroon', rotulo: 'Vinho', hex: 'ae424a' },
  { valor: 'teal', rotulo: 'Azul-petróleo', hex: '00cfdf' },
  { valor: 'white', rotulo: 'Branco', hex: 'e5e6c7' },
] as const

// "plain" + sobrancelha grossa + olho castanho (valores antigos) deixavam o
// rosto quase invisível: o cabelo cobre a testa inteira e o olho escuro se
// mistura com a sobrancelha escura (ver frame parado, linha 10 col 0 — não
// tem boca/nariz na sprite base, só olhos+sobrancelha marcam o rosto).
// "long" deixa a testa à mostra, sobrancelha fina não gruda no olho, e olho
// azul contrasta bem com qualquer tom de pele — resultado bem mais legível
// como padrão. Continua 100% customizável, isso só muda o ponto de partida.
export const AVATAR_PADRAO: MacuAvatarConfig = {
  gender: 'male',
  skinTone: 'light',
  hairStyle: 'long',
  hairColor: 'dark_brown',
  eyebrowStyle: 'thin',
  eyeColor: 'blue',
  shirtColor: 'navy',
  pantsColor: 'brown',
  shoeColor: 'black',
}

type Camada = 'body' | 'shoes' | 'pants' | 'shirt' | 'eyes' | 'eyebrows' | 'hair'

// Ordem de empilhamento (baixo -> cima), igual ao zPos oficial do LPC:
// body(10) < shoes(15) < pants(20) < shirt(35) < eyes(105) < eyebrows(106) < hair(120)
export const ORDEM_DAS_CAMADAS: Camada[] = ['body', 'shoes', 'pants', 'shirt', 'eyes', 'eyebrows', 'hair']

export function caminhoDaCamada(camada: Camada, config: MacuAvatarConfig): string {
  switch (camada) {
    case 'body':
      return `/assets/lpc/body/${config.gender}/${config.skinTone}.png`
    case 'shoes':
      return `/assets/lpc/shoes/${config.gender}/${config.shoeColor}.png`
    case 'pants':
      return `/assets/lpc/pants/${config.gender}/${config.pantsColor}.png`
    case 'shirt':
      return `/assets/lpc/shirt/${config.gender}/${config.shirtColor}.png`
    case 'eyes':
      return `/assets/lpc/eyes/${config.eyeColor}.png`
    case 'eyebrows':
      return `/assets/lpc/eyebrows/${config.eyebrowStyle}/${config.hairColor}.png`
    case 'hair':
      return `/assets/lpc/hair/${config.hairStyle}/${config.gender}/${config.hairColor}.png`
  }
}

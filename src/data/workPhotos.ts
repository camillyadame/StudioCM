import type { Focus } from '@/components/FocusImage'
import capping from '@/assets/trabalhos/unhas-capping.jpeg'
import fox from '@/assets/trabalhos/cilios-fox-eyes.jpeg'
import volume4d from '@/assets/trabalhos/cilios-volume-4d.jpeg'
import volumeBrasileiro from '@/assets/trabalhos/cilios-volume-brasileiro.jpeg'
import volumeLight from '@/assets/trabalhos/cilios-volume-light.jpeg'
import volume6d from '@/assets/trabalhos/cilios-volume-6d.jpeg'
import volumeArabe from '@/assets/trabalhos/cilios-volume-arabe.jpeg'
import alongSimples from '@/assets/trabalhos/unhas-alongamento-simples.jpeg'
import alongNailArt from '@/assets/trabalhos/unhas-alongamento-nail-art.jpeg'
import banhoGel from '@/assets/trabalhos/unhas-banho-de-gel.jpeg'
import postica from '@/assets/trabalhos/unhas-postica.jpeg'

/*
  Fotos reais de trabalhos, ligadas ao serviço do catálogo pelo id.
  Fotos de cílios sempre levam `focus`: o site mostra só o olhar, nunca o
  rosto da cliente (pedido da Camilly).
*/
export type WorkPhoto = { src: string; focus?: Focus }

const PORTRAIT = 4 / 3

export const WORK_PHOTOS: Record<string, WorkPhoto> = {
  'carol-volume-arabe': { src: volumeArabe, focus: { x: 0.63, y: 0.43, zoom: 3.2, ratio: 2978 / 2233 } },
  'carol-fox': { src: fox, focus: { x: 0.72, y: 0.09, zoom: 3, ratio: PORTRAIT } },
  'carol-volume-4d': { src: volume4d, focus: { x: 0.66, y: 0.4, zoom: 2.6, ratio: PORTRAIT } },
  'carol-volume-6d': { src: volume6d, focus: { x: 0.75, y: 0.35, zoom: 2.6, ratio: 1506 / 1600 } },
  'carol-volume-brasileiro': { src: volumeBrasileiro, focus: { x: 0.66, y: 0.53, zoom: 3.4, ratio: 2794 / 2096 } },
  'carol-capping': { src: capping, focus: { x: 0.67, y: 0.71, zoom: 3, ratio: 1280 / 960 } },
  'carol-volume-light': { src: volumeLight, focus: { x: 0.63, y: 0.58, zoom: 4, ratio: PORTRAIT } },
  'malu-along-simples': { src: alongSimples },
  'malu-along-nailart': { src: alongNailArt },
  'malu-banho-simples': { src: banhoGel },
  'malu-postica-simples': { src: postica },
}

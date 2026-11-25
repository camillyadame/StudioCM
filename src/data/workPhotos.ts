import type { Focus } from '@/components/FocusImage'
import capping from '@/imports/WhatsApp_Image_2026-08-11_at_23.01.43.jpeg'
import fox from '@/imports/WhatsApp_Image_2026-08-11_at_23.00.14.jpeg'
import volume4d from '@/imports/WhatsApp_Image_2026-08-11_at_22.36.59.jpeg'
import volumeBrasileiro from '@/imports/WhatsApp_Image_2026-08-11_at_22.35.13.jpeg'
import volumeLight from '@/imports/WhatsApp_Image_2026-08-11_at_22.18.33.jpeg'
import volume6d from '@/imports/Volume6d.jpeg'
import volumeArabe from '@/imports/VolumeArabe.jpeg'
import alongSimples from '@/imports/WhatsApp_Image_2026-08-09_at_18.53.35.jpeg'
import alongNailArt from '@/imports/WhatsApp_Image_2026-08-09_at_18.53.48.jpeg'
import banhoGel from '@/imports/WhatsApp_Image_2026-08-09_at_18.54.03.jpeg'
import postica from '@/imports/WhatsApp_Image_2026-08-09_at_18.54.17.jpeg'

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

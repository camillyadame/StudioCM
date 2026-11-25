/*
  Mostra só um trecho da foto (ex.: o olhar), sem expor o rosto da cliente.
  O ponto (x, y) da foto fica o mais perto possível do centro do quadro,
  sem deixar bordas vazias. Não cria arquivos novos: o recorte é só visual.
*/
export type Focus = {
  /** Posição do ponto focal na foto, de 0 a 1. */
  x: number
  y: number
  /** Quantas vezes a foto é mais larga que o quadro. */
  zoom: number
  /** Altura ÷ largura da foto original. */
  ratio: number
}

type Props = {
  src: string
  alt: string
  focus: Focus
  /** Altura ÷ largura do quadro (4/5 → 1.25). */
  frameRatio?: number
  className?: string
  loading?: 'lazy' | 'eager'
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export default function FocusImage({ src, alt, focus, frameRatio = 1.25, className, loading = 'lazy' }: Props) {
  const width = focus.zoom * 100 // % da largura do quadro
  const height = (focus.zoom * focus.ratio * 100) / frameRatio // % da altura do quadro
  const left = clamp(50 - focus.x * width, 100 - width, 0)
  const top = clamp(50 - focus.y * height, 100 - height, 0)

  return (
    <div
      className={`focus-frame ${className ?? ''}`}
      style={{ aspectRatio: `1 / ${frameRatio}` }}
    >
      <img
        src={src}
        alt={alt}
        loading={loading}
        style={{ width: `${width}%`, left: `${left}%`, top: `${top}%` }}
      />
    </div>
  )
}

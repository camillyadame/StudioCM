import ProfilePage, { type ProfileContent } from '@/components/ProfilePage'
import { MaluMenu } from '@/components/ServiceMenus'
import maluAvatar from '@/imports/malu-nail-designer.png'

const CONTENT: ProfileContent = {
  id: 'malu',
  avatar: maluAvatar,
  area: 'Unhas',
  headline: 'Unhas que expressam',
  accent: 'você',
  lede: 'Alongamentos, esmaltações e nail art pensadas para valorizar o seu estilo, a sua personalidade e cada detalhe das suas mãos.',
  menu: <MaluMenu />,
  closing: 'Pronta para mãos impecáveis',
}

export default function Malu() {
  return <ProfilePage content={CONTENT} />
}

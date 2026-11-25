import { SPECIALISTS } from '@catalog'
import ProfilePage, { type ProfileContent } from '@/components/ProfilePage'
import { CarolMenu } from '@/components/ServiceMenus'
import carolAvatar from '@/imports/carol-lash-designer-v2.png'

const CONTENT: ProfileContent = {
  id: 'carol',
  avatar: carolAvatar,
  area: 'Cílios',
  headline: 'Cílios que contam',
  accent: 'histórias',
  lede: 'Extensões de cílios personalizadas para valorizar o seu olhar. Cada aplicação é pensada para realçar o que há de mais bonito em você.',
  menu: <CarolMenu />,
  faq: [
    { q: 'Quanto tempo dura a extensão?', a: `Em média 3 a 4 semanas, dependendo do ciclo de cada pessoa. Com manutenção a cada ${SPECIALISTS.carol.maintenanceWindow}, fica sempre bonita.` },
    { q: 'Posso usar máscara de cílios por cima?', a: 'Não recomendamos. A extensão já dá o volume e o comprimento. Se usar, prefira máscaras sem óleo e aplique só nas pontas.' },
    { q: 'Preciso de algum cuidado especial?', a: 'Evite óleo, vapor e umidade nas primeiras 24h. Não esfregue os olhos e use a escovinha todos os dias para manter o formato.' },
    { q: 'É seguro para olhos sensíveis?', a: 'Sim. Usamos colas hipoalergênicas de alta qualidade. Se você tem histórico de alergia, avise antes para fazermos um teste.' },
  ],
  closing: 'Pronta para transformar o seu olhar',
}

export default function Carol() {
  return <ProfilePage content={CONTENT} />
}

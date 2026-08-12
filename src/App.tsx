import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import Home from './pages/Home'
import Carol from './pages/Carol'
import Malu from './pages/Malu'
import Services from './pages/Services'
import Gallery from './pages/Gallery'
import Booking from './pages/Booking'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Layout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/carol" element={<Carol />} />
          <Route path="/malu" element={<Malu />} />
          <Route path="/servicos" element={<Services />} />
          <Route path="/galeria" element={<Gallery />} />
          <Route path="/agendamento" element={<Booking />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}

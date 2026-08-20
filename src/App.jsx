import { Routes, Route } from 'react-router-dom'
import Hub from './pages/Hub'
import Kombucha from './pages/Kombucha'
import Slambuc from './pages/Slambuc'
import Pizza from './pages/Pizza'
import Sourdough from './pages/Sourdough'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="/kombucha" element={<Kombucha />} />
      <Route path="/slambuc" element={<Slambuc />} />
      <Route path="/pizza" element={<Pizza />} />
      <Route path="/sourdough" element={<Sourdough />} />
    </Routes>
  )
}

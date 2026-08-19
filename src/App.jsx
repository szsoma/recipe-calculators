import { Routes, Route } from 'react-router-dom'
import Hub from './pages/Hub'
import Kombucha from './pages/Kombucha'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="/kombucha" element={<Kombucha />} />
      <Route path="/slambuc" element={<div className="p-8 text-center">Slambuc</div>} />
      <Route path="/pizza" element={<div className="p-8 text-center">Pizza</div>} />
    </Routes>
  )
}

import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div className="p-8 text-center">Hub</div>} />
      <Route path="/kombucha" element={<div className="p-8 text-center">Kombucha</div>} />
      <Route path="/slambuc" element={<div className="p-8 text-center">Slambuc</div>} />
      <Route path="/pizza" element={<div className="p-8 text-center">Pizza</div>} />
    </Routes>
  )
}

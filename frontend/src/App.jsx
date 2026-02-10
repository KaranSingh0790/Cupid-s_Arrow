// Main App component with routing
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import ModeSelector from './pages/ModeSelector'
import ExperienceBuilder from './pages/ExperienceBuilder'
import Preview from './pages/Preview'
import Payment from './pages/Payment'
import Success from './pages/Success'
import Playback from './pages/Playback'
// Stripe payment pages
import StripeSuccess from './pages/StripeSuccess'
import StripeCancel from './pages/StripeCancel'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing */}
        <Route path="/" element={<Landing />} />

        {/* Experience creation flow */}
        <Route path="/create" element={<ModeSelector />} />
        <Route path="/create/form" element={<ExperienceBuilder />} />
        <Route path="/create/preview" element={<Preview />} />
        <Route path="/create/payment" element={<Payment />} />
        <Route path="/create/success" element={<Success />} />

        {/* Stripe payment redirects */}
        <Route path="/create/payment/success" element={<StripeSuccess />} />
        <Route path="/create/payment/cancel" element={<StripeCancel />} />

        {/* Experience playback for recipients */}
        <Route path="/v/:id" element={<Playback />} />

        {/* Fallback */}
        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

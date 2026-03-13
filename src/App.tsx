import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './components/Home';
import ItineraryView from './components/ItineraryView';

function AppContent() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/itinerary/:id" element={<ItineraryView />} />
      </Routes>
    </div>
  );
}

export default function App() {
  // GitHub Pages 部署在 /travelmark/ 子路径下
  const basename = import.meta.env.MODE === 'production' ? '/travelmark' : '/';
  return (
    <BrowserRouter basename={basename}>
      <AppContent />
    </BrowserRouter>
  );
}

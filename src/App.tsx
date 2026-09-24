import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Planificacion from './pages/Planificacion';
import Costos from './pages/Costos';
import Infraestructura from './pages/Infraestructura';
import Seguridad from './pages/Seguridad';
import ArquitecturaRed from './pages/ArquitecturaRed';
import Servicios from './pages/Servicios';
import { RegionProvider } from './context/RegionContext';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
    <RegionProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/planificacion" element={<Planificacion />} />
          <Route path="/costos" element={<Costos />} />
          <Route path="/infraestructura" element={<Infraestructura />} />
          <Route path="/seguridad" element={<Seguridad />} />
          <Route path="/red" element={<ArquitecturaRed />} />
          <Route path="/servicios" element={<Servicios />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </RegionProvider>
    </ThemeProvider>
  );
}
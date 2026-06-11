// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Painel from './pages/Painel';
import AdminLogin from './pages/AdminLogin';
import AdminPainel from './pages/AdminPainel';
import AdminAlertas from './pages/AdminAlertas';
import AdminInfracoes from './pages/AdminInfracoes';
import AdminVeiculos from './pages/AdminVeiculos';
import ConsultaProtocolo from './pages/ConsultaProtocolo'; // <-- 1. Importe aqui
import SolicitacaoEvento from './pages/SolicitacaoEvento';
import PortalNoticias from './pages/PortalNoticias';
import NoticiaDetalhe from './pages/NoticiaDetalhe';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/painel" element={<Painel />} />
        
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/painel" element={<AdminPainel />} />
        <Route path="/admin/alertas" element={<AdminAlertas />} />
        <Route path="/admin/infracoes" element={<AdminInfracoes />} />
        <Route path="/admin/veiculos" element={<AdminVeiculos />} />
        <Route path="/consultar" element={<ConsultaProtocolo />} /> {/* <-- 2. Adicione a rota */}
        <Route path="/solicitacao-evento" element={<SolicitacaoEvento />} />
        <Route path="/noticias" element={<PortalNoticias />} />
        <Route path="/noticias/:id" element={<NoticiaDetalhe />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
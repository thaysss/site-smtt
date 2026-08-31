import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Painel from './pages/Painel';
import AdminLogin from './pages/AdminLogin';
import AdminPainel from './pages/AdminPainel';
import AdminDashboard from './pages/AdminDashboard';
import AdminAlertas from './pages/AdminAlertas';
import AdminInfracoes from './pages/AdminInfracoes';
import AdminVeiculos from './pages/AdminVeiculos';
import AdminUsuarios from './pages/AdminUsuarios';
import ConsultaProtocolo from './pages/ConsultaProtocolo';
import SolicitacaoEvento from './pages/SolicitacaoEvento';
import SolicitacaoAlvara from './pages/SolicitacaoAlvara';
import PortalNoticias from './pages/PortalNoticias';
import NoticiaDetalhe from './pages/NoticiaDetalhe';
import ContestacaoMulta from './pages/ContestacaoMulta';
import FaleConosco from './pages/FaleConosco';
import Termos from './pages/Termos';
import Privacidade from './pages/Privacidade';

// Guarda de Rota para Cidadão Autenticado
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// Guarda de Rota para Administrador Autenticado
const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin/login" replace />;
};

function App() {
  useEffect(() => {
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      
      // 15 minutos (15 * 60 * 1000 = 900000 ms)
      timeoutId = setTimeout(() => {
        const token = localStorage.getItem('token');
        const adminToken = localStorage.getItem('adminToken');

        if (token || adminToken) {
          if (adminToken) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminNome');
            window.location.href = '/admin/login?message=session_expired';
          } else if (token) {
            localStorage.removeItem('token');
            localStorage.removeItem('nomeUsuario');
            window.location.href = '/login?message=session_expired';
          }
        }
      }, 900000);
    };

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });
    
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/painel" element={<ProtectedRoute><Painel /></ProtectedRoute>} />
        
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/painel" element={<AdminProtectedRoute><AdminPainel /></AdminProtectedRoute>} />
        <Route path="/admin/alertas" element={<AdminProtectedRoute><AdminAlertas /></AdminProtectedRoute>} />
        <Route path="/admin/infracoes" element={<AdminProtectedRoute><AdminInfracoes /></AdminProtectedRoute>} />
        <Route path="/admin/veiculos" element={<AdminProtectedRoute><AdminVeiculos /></AdminProtectedRoute>} />
        <Route path="/admin/usuarios" element={<AdminProtectedRoute><AdminUsuarios /></AdminProtectedRoute>} />
        <Route path="/consultar" element={<ConsultaProtocolo />} />
        <Route path="/solicitacao-evento" element={<SolicitacaoEvento />} />
        <Route path="/solicitacao-alvara" element={<SolicitacaoAlvara />} />
        <Route path="/contestacao-multa" element={<ContestacaoMulta />} />
        <Route path="/noticias" element={<PortalNoticias />} />
        <Route path="/noticias/:id" element={<NoticiaDetalhe />} />
        <Route path="/fale-conosco" element={<FaleConosco />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="/privacidade" element={<Privacidade />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { canAccessAdmin } from './utils/adminPermissions';
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Painel = lazy(() => import('./pages/Painel'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminPainel = lazy(() => import('./pages/AdminPainel'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminAlertas = lazy(() => import('./pages/AdminAlertas'));
const AdminInfracoes = lazy(() => import('./pages/AdminInfracoes'));
const AdminVeiculos = lazy(() => import('./pages/AdminVeiculos'));
const AdminUsuarios = lazy(() => import('./pages/AdminUsuarios'));
const ConsultaProtocolo = lazy(() => import('./pages/ConsultaProtocolo'));
const SolicitacaoEvento = lazy(() => import('./pages/SolicitacaoEvento'));
const SolicitacaoAlvara = lazy(() => import('./pages/SolicitacaoAlvara'));
const PortalNoticias = lazy(() => import('./pages/PortalNoticias'));
const NoticiaDetalhe = lazy(() => import('./pages/NoticiaDetalhe'));
const ContestacaoMulta = lazy(() => import('./pages/ContestacaoMulta'));
const FaleConosco = lazy(() => import('./pages/FaleConosco'));
const Termos = lazy(() => import('./pages/Termos'));
const Privacidade = lazy(() => import('./pages/Privacidade'));

// Guarda de Rota para Cidadão Autenticado
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// Guarda de Rota para Administrador Autenticado
const AdminProtectedRoute = ({ children, feature }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/admin/login" replace />;
  return !feature || canAccessAdmin(feature) ? children : <Navigate to="/admin/dashboard" replace />;
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
      <Suspense fallback={<div className="min-h-screen grid place-items-center">Carregando…</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/painel" element={<ProtectedRoute><Painel /></ProtectedRoute>} />
        
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/painel" element={<AdminProtectedRoute><AdminPainel /></AdminProtectedRoute>} />
        <Route path="/admin/alvaras" element={<AdminProtectedRoute feature="alvaras"><AdminPainel defaultTab="alvaras" /></AdminProtectedRoute>} />
        <Route path="/admin/alertas" element={<AdminProtectedRoute feature="alertas"><AdminAlertas /></AdminProtectedRoute>} />
        <Route path="/admin/infracoes" element={<AdminProtectedRoute feature="lancar-infracao"><AdminInfracoes /></AdminProtectedRoute>} />
        <Route path="/admin/veiculos" element={<AdminProtectedRoute feature="veiculos"><AdminVeiculos /></AdminProtectedRoute>} />
        <Route path="/admin/usuarios" element={<AdminProtectedRoute feature="usuarios"><AdminUsuarios /></AdminProtectedRoute>} />
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

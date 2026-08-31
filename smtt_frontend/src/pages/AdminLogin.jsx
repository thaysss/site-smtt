// src/pages/AdminLogin.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { UserRound, LockKeyhole, ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';

function AdminLogin() {
  const location = useLocation();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('message') === 'session_expired') {
      return 'Sua sessão expirou por inatividade ou tempo limite. Por favor, faça login novamente.';
    }
    return '';
  });
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('message') === 'session_expired') {
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      // Adicionamos o /auth aqui no começo do endereço
      const response = await api.post('/auth/admin/login', { usuario, senha });
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminNome', response.data.nome);
      navigate('/admin/dashboard');
    } catch (error) {
      setErro(error.response?.data?.erro || 'Credenciais inválidas.');
    }
  };

  return (
    <main className="admin-login">
      <section className="admin-login-brand" aria-label="Identificação institucional">
        <div className="admin-login-brand-content">
          <div className="admin-login-logo-box">
            <img src="/SMTT.png" alt="SMTT Propriá" />
          </div>
          <p className="admin-login-eyebrow">Superintendência Municipal</p>
          <h1>SMTT Propriá</h1>
          <p className="admin-login-subtitle">Ambiente interno monitorado</p>
          <div className="admin-login-security">
            <ShieldCheck size={20} />
            <span>Acesso restrito a servidores autorizados</span>
          </div>
        </div>
      </section>

      <section className="admin-login-panel">
        <div className="admin-login-form-wrap">
          <div className="admin-login-mobile-brand">
            <img src="/SMTT.png" alt="SMTT Propriá" />
            <strong>SMTT Propriá</strong>
            <span>Ambiente interno monitorado</span>
          </div>

          <div className="admin-login-heading">
            <span>Portal do servidor</span>
            <h2>Acesso ao sistema</h2>
            <p>Insira suas credenciais para continuar.</p>
          </div>

          {erro && <div className="admin-login-error" role="alert">{erro}</div>}

          <form onSubmit={handleLogin} className="admin-login-form">
            <div>
              <label htmlFor="admin-usuario">Usuário ou matrícula</label>
              <div className="admin-login-field">
                <UserRound size={20} />
                <input id="admin-usuario" type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Ex: 123456" autoComplete="username" required />
              </div>
            </div>

            <div>
              <label htmlFor="admin-senha">Senha</label>
              <div className="admin-login-field">
                <LockKeyhole size={20} />
                <input id="admin-senha" type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Digite sua senha" autoComplete="current-password" required />
                <button type="button" onClick={() => setMostrarSenha((value) => !value)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}>
                  {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="admin-login-submit">Entrar no sistema</button>
            <button type="button" onClick={() => navigate('/')} className="admin-login-back">
              <ArrowLeft size={18} /> Voltar ao Portal Público
            </button>
          </form>

          <p className="admin-login-footer">© 2026 SMTT Propriá. Todos os direitos reservados.</p>
        </div>
      </section>
    </main>
  );
}

export default AdminLogin;

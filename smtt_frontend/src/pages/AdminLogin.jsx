// src/pages/AdminLogin.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { UserRound, LockKeyhole, Eye, EyeOff, ShieldCheck, UsersRound, LogIn, Globe2, Building2 } from 'lucide-react';

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
          <img className="admin-login-logo" src="/SMTT.png" alt="SMTT Propriá" />
          <p className="admin-login-eyebrow">Superintendência Municipal</p>
          <h1>SMTT Propriá</h1>
          <span className="admin-login-accent" aria-hidden="true" />
          <p className="admin-login-subtitle">Ambiente interno monitorado</p>
          <div className="admin-login-benefits">
            <div><span><ShieldCheck /></span><strong>Acesso seguro</strong><small>Seus dados protegidos</small></div>
            <div><span><UsersRound /></span><strong>Uso exclusivo</strong><small>Servidores autorizados</small></div>
            <div><span><LockKeyhole /></span><strong>Conexão segura</strong><small>Protegido por criptografia</small></div>
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
            <span className="admin-login-heading-icon"><LockKeyhole size={23} /></span>
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

            <div className="admin-login-options">
              <label><input type="checkbox" /> <span>Lembrar meu acesso</span></label>
              <button type="button">Esqueci minha senha</button>
            </div>
            <button type="submit" className="admin-login-submit"><LogIn size={19} /> Entrar no sistema</button>
            <div className="admin-login-divider"><span>ou</span></div>
            <button type="button" onClick={() => navigate('/')} className="admin-login-back">
              <Globe2 size={19} /> Acessar Portal Público
            </button>
          </form>
        </div>
      </section>
      <footer className="admin-login-footer">
        <div className="admin-login-footer-brand"><Building2 /><span><strong>SMTT Propriá</strong><small>Superintendência Municipal de<br />Trânsito e Transporte de Propriá - SE</small></span></div>
        <p>© 2026 SMTT Propriá.<br />Todos os direitos reservados.</p>
        <ShieldCheck />
      </footer>
    </main>
  );
}

export default AdminLogin;

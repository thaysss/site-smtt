// src/pages/AdminLogin.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { UserRound, LockKeyhole, Eye, EyeOff, ShieldCheck, LogIn, Globe2, TrafficCone, UsersRound, Leaf } from 'lucide-react';

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
        <div className="admin-login-slogan">
          <span>Mobilidade</span>
          <span>Segura</span>
          <span>Cidade Melhor</span>
          <i aria-hidden="true" />
        </div>

        <div className="admin-login-brand-content">
          <img className="admin-login-logo" src="/SMTT.png" alt="SMTT Propriá" />
          <p className="admin-login-eyebrow">Superintendência Municipal</p>
          <h1>SMTT Propriá</h1>
          <span className="admin-login-accent" aria-hidden="true" />
          <p className="admin-login-subtitle">Gestão, mobilidade e<br />segurança no trânsito.</p>
        </div>

        <div className="admin-login-benefits" aria-label="Compromissos da SMTT">
          <div><TrafficCone /><span>Trânsito<br />mais seguro</span></div>
          <div><UsersRound /><span>Cidade<br />mais humana</span></div>
          <div><Leaf /><span>Mobilidade<br />sustentável</span></div>
        </div>
      </section>

      <section className="admin-login-panel">
        <img className="admin-login-city-logo" src="/prefe.jpg" alt="Prefeitura de Propriá — Trabalho que transforma" />

        <div className="admin-login-form-wrap">
          <div className="admin-login-mobile-brand">
            <img src="/SMTT.png" alt="SMTT Propriá" />
            <strong>SMTT Propriá</strong>
            <span>Área administrativa</span>
          </div>

          <div className="admin-login-heading">
            <span className="admin-login-heading-icon"><LockKeyhole size={23} /></span>
            <span>Área administrativa</span>
            <i aria-hidden="true" />
            <h2>Bem-vindo de volta</h2>
            <p>Acesse sua conta institucional<br />para continuar.</p>
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

          <div className="admin-login-restricted">
            <ShieldCheck />
            <span><strong>Ambiente restrito</strong><small>Apenas usuários autorizados podem acessar este sistema.</small></span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminLogin;

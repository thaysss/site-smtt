// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  FileDigit,
  LoaderCircle,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';

const formatCpf = (value) => value
  .replace(/\D/g, '')
  .slice(0, 11)
  .replace(/(\d{3})(\d)/, '$1.$2')
  .replace(/(\d{3})(\d)/, '$1.$2')
  .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
};

function FormField({ id, label, icon: Icon, className = '', ...inputProps }) {
  return (
    <div className={`citizen-auth-group ${className}`}>
      <label htmlFor={id}>{label}</label>
      <div className="citizen-auth-field">
        <Icon size={19} aria-hidden="true" />
        <input id={id} {...inputProps} />
      </div>
    </div>
  );
}

function Login() {
  const [isCadastro, setIsCadastro] = useState(false);
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const location = useLocation();
  const [erro, setErro] = useState(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('message') === 'session_expired') {
      return 'Sua sessão expirou. Faça login novamente para continuar.';
    }
    return location.state?.mensagem || '';
  });
  const [sucesso, setSucesso] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('message') === 'session_expired') {
      navigate(location.pathname, { replace: true });
    } else if (location.state?.mensagem) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const trocarModo = (cadastro) => {
    setIsCadastro(cadastro);
    setErro('');
    setSucesso('');
    setMostrarSenha(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro('');
    setSucesso('');
    setEnviando(true);

    const cpfNumerico = cpf.replace(/\D/g, '');
    const telefoneNumerico = telefone.replace(/\D/g, '');

    if (cpfNumerico.length !== 11) {
      setErro('Digite um CPF com 11 números.');
      setEnviando(false);
      return;
    }

    try {
      if (isCadastro) {
        await api.post('/auth/cadastro', {
          nome: nome.trim(),
          cpf: cpfNumerico,
          email: email.trim().toLowerCase(),
          senha,
          telefone: telefoneNumerico,
          endereco: endereco.trim(),
        });
        setSucesso('Conta criada com sucesso! Agora entre com seu CPF e senha.');
        setIsCadastro(false);
        setSenha('');
        setMostrarSenha(false);
      } else {
        const response = await api.post('/auth/login', { cpf: cpfNumerico, senha });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('nomeUsuario', response.data.nome);
        navigate('/painel');
      }
    } catch (error) {
      setErro(error.response?.data?.erro || (isCadastro ? 'Não foi possível criar a conta.' : 'CPF ou senha inválidos.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="citizen-auth-page">
      <header className="citizen-auth-header">
        <button type="button" className="citizen-auth-logo" onClick={() => navigate('/')} aria-label="Ir para a página inicial">
          <img src="/logo-smtt.png" alt="SMTT Propriá" />
        </button>
        <button type="button" className="citizen-auth-back" onClick={() => navigate('/')}>
          <ArrowLeft size={17} aria-hidden="true" />
          <span>Voltar ao início</span>
        </button>
      </header>

      <main className="citizen-auth-main">
        <section className={`citizen-auth-card ${isCadastro ? 'is-register' : ''}`}>
          <aside className="citizen-auth-intro">
            <div>
              <span className="citizen-auth-badge">
                <ShieldCheck size={16} aria-hidden="true" />
                Portal do Cidadão
              </span>
              <h1>{isCadastro ? 'Crie seu acesso aos serviços digitais' : 'Seus serviços em um só lugar'}</h1>
              <p>{isCadastro
                ? 'Informe seus dados para acompanhar solicitações e utilizar os serviços online da SMTT.'
                : 'Entre com segurança para consultar e acompanhar suas solicitações.'}</p>
            </div>
            <ul className="citizen-auth-benefits" aria-label="Benefícios do portal">
              <li><CheckCircle2 size={18} /> Acompanhamento de protocolos</li>
              <li><CheckCircle2 size={18} /> Dados protegidos e acesso seguro</li>
              <li><CheckCircle2 size={18} /> Serviços disponíveis pela internet</li>
            </ul>
          </aside>

          <div className="citizen-auth-form-panel">
            <div className="citizen-auth-heading">
              <span>{isCadastro ? 'Novo cadastro' : 'Bem-vindo de volta'}</span>
              <h2>{isCadastro ? 'Criar conta' : 'Entrar no portal'}</h2>
              <p>{isCadastro
                ? 'Preencha todos os campos abaixo com seus dados reais.'
                : 'Use o CPF cadastrado e sua senha de acesso.'}</p>
            </div>

            {erro && <div className="citizen-auth-message is-error" role="alert"><AlertCircle size={18} /><span>{erro}</span></div>}
            {sucesso && <div className="citizen-auth-message is-success" role="status"><CheckCircle2 size={18} /><span>{sucesso}</span></div>}

            <form onSubmit={handleSubmit} className="citizen-auth-form">
              {isCadastro && (
                <>
                  <FormField id="nome-completo" label="Nome completo" icon={User} className="is-full" type="text" value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Digite seu nome completo" autoComplete="name" minLength={3} required />
                  <FormField id="email" label="E-mail" icon={Mail} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@exemplo.com" autoComplete="email" required />
                  <FormField id="telefone" label="Telefone" icon={Phone} type="tel" inputMode="numeric" value={telefone} onChange={(event) => setTelefone(formatPhone(event.target.value))} placeholder="(79) 99999-9999" autoComplete="tel" minLength={14} required />
                  <FormField id="endereco" label="Endereço" icon={MapPin} className="is-full" type="text" value={endereco} onChange={(event) => setEndereco(event.target.value)} placeholder="Rua, número e bairro" autoComplete="street-address" minLength={5} required />
                </>
              )}

              <FormField id="cpf" label="CPF" icon={FileDigit} type="text" inputMode="numeric" value={cpf} onChange={(event) => setCpf(formatCpf(event.target.value))} placeholder="000.000.000-00" autoComplete="username" minLength={14} required />

              <div className="citizen-auth-group">
                <label htmlFor="senha">Senha</label>
                <div className="citizen-auth-field has-action">
                  <Lock size={19} aria-hidden="true" />
                  <input id="senha" type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={(event) => setSenha(event.target.value)} placeholder={isCadastro ? 'Mínimo de 6 caracteres' : 'Digite sua senha'} autoComplete={isCadastro ? 'new-password' : 'current-password'} minLength={isCadastro ? 6 : undefined} required />
                  <button type="button" onClick={() => setMostrarSenha((valor) => !valor)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}>
                    {mostrarSenha ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
                {isCadastro && <small>Use pelo menos 6 caracteres.</small>}
              </div>

              <button type="submit" className="citizen-auth-submit is-full" disabled={enviando}>
                {enviando && <LoaderCircle size={19} className="citizen-auth-spinner" />}
                {enviando ? 'Aguarde...' : (isCadastro ? 'Criar minha conta' : 'Entrar no painel')}
              </button>
            </form>

            <div className="citizen-auth-switch">
              <span>{isCadastro ? 'Já possui uma conta?' : 'Ainda não possui cadastro?'}</span>
              <button type="button" onClick={() => trocarModo(!isCadastro)}>{isCadastro ? 'Fazer login' : 'Criar conta gratuitamente'}</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Login;

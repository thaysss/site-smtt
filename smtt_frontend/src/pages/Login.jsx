import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, FileDigit, FileText, LoaderCircle, Lock, Mail, MapPin, Phone, ShieldCheck, User, UsersRound } from 'lucide-react';

const formatCpf = (value) => value.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits.length <= 10 ? digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2') : digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
};

function FormField({ id, label, icon: Icon, className = '', ...inputProps }) {
  return <div className={`citizen-auth-group ${className}`}><label htmlFor={id}>{label}</label><div className="citizen-auth-field"><Icon size={19} aria-hidden="true" /><input id={id} {...inputProps} /></div></div>;
}

function Login() {
  const [modo, setModo] = useState('login');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const location = useLocation();
  const [erro, setErro] = useState(() => new URLSearchParams(location.search).get('message') === 'session_expired' ? 'Sua sessão expirou. Faça login novamente para continuar.' : (location.state?.mensagem || ''));
  const [sucesso, setSucesso] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (new URLSearchParams(location.search).get('message') === 'session_expired') navigate(location.pathname, { replace: true });
    else if (location.state?.mensagem) navigate(location.pathname, { replace: true, state: {} });
  }, [location, navigate]);

  const trocarModo = (novoModo) => { setModo(novoModo); setErro(''); setSucesso(''); setCodigo(''); setMostrarSenha(false); };
  const cpfNumerico = cpf.replace(/\D/g, '');

  const handleSubmit = async (event) => {
    event.preventDefault(); setErro(''); setSucesso(''); setEnviando(true);
    if (cpfNumerico.length !== 11) { setErro('Digite um CPF com 11 números.'); setEnviando(false); return; }
    try {
      if (modo === 'cadastro') {
        const response = await api.post('/auth/cadastro', { nome: nome.trim(), cpf: cpfNumerico, email: email.trim().toLowerCase(), senha, telefone: telefone.replace(/\D/g, ''), endereco: endereco.trim() });
        setSucesso(response.data.mensagem); setModo('confirmar'); setCodigo('');
      } else if (modo === 'confirmar') {
        const response = await api.post('/auth/cadastro/confirmar', { cpf: cpfNumerico, codigo });
        setSucesso(response.data.mensagem); setModo('login'); setSenha(''); setCodigo('');
      } else if (modo === 'esqueci') {
        const response = await api.post('/auth/senha/esqueci', { cpf: cpfNumerico, email: email.trim().toLowerCase() });
        setSucesso(response.data.mensagem); setModo('redefinir'); setCodigo('');
      } else if (modo === 'redefinir') {
        const response = await api.post('/auth/senha/redefinir', { cpf: cpfNumerico, email: email.trim().toLowerCase(), codigo, nova_senha: novaSenha });
        setSucesso(response.data.mensagem); setModo('login'); setCodigo(''); setNovaSenha('');
      } else {
        const response = await api.post('/auth/login', { cpf: cpfNumerico, senha });
        localStorage.setItem('token', response.data.token); localStorage.setItem('nomeUsuario', response.data.nome); localStorage.setItem('cpfUsuario', cpfNumerico); navigate('/painel');
      }
    } catch (error) {
      setErro(error.response?.data?.erro || 'Não foi possível concluir a solicitação. Tente novamente.');
    } finally { setEnviando(false); }
  };

  const cadastro = modo === 'cadastro';
  const titulo = { login: 'Entrar no portal', cadastro: 'Criar conta', confirmar: 'Confirmar e-mail', esqueci: 'Recuperar senha', redefinir: 'Criar nova senha' }[modo];
  const descricao = { login: 'Use o CPF cadastrado e sua senha de acesso.', cadastro: 'Preencha seus dados. Enviaremos um código ao seu e-mail.', confirmar: 'Digite o código de 6 números enviado ao seu e-mail.', esqueci: 'Informe CPF e e-mail cadastrados para receber um código.', redefinir: 'Digite o código recebido e escolha sua nova senha.' }[modo];

  return <div className="citizen-auth-page">
    <button type="button" className="citizen-auth-back" onClick={() => navigate('/')}><ArrowLeft size={17} /><span>Voltar ao site</span></button>
    <main className="citizen-auth-main"><section className={`citizen-auth-card ${cadastro ? 'is-register' : ''}`}>
      <aside className="citizen-auth-intro">
        <div className="citizen-auth-brand"><img src="/SMTT.png" alt="SMTT Propriá" /><span>Trânsito mais seguro<br />para uma cidade melhor.</span></div>
        <div className="citizen-auth-pitch"><h1>Mobilidade que conecta <strong>pessoas</strong> e <strong>oportunidades</strong></h1><p>Serviços públicos digitais, seguros e mais próximos de você.</p></div>
        <ul className="citizen-auth-benefits"><li><UsersRound size={21} /><span><strong>Serviços online</strong>Mais praticidade para o cidadão</span></li><li><FileText size={21} /><span><strong>Acesso rápido</strong>Consulte, solicite e acompanhe</span></li><li><ShieldCheck size={21} /><span><strong>Trânsito mais seguro</strong>Compromisso com você</span></li></ul>
        <div className="citizen-auth-signature"><i></i><strong>SMTT Propriá/SE</strong><span>Trabalho, organização e segurança<br />por uma cidade que avança.</span></div>
      </aside>
      <div className="citizen-auth-form-panel"><div className="citizen-auth-city"><img src="/logo-pequena.jpeg" alt="Brasão de Propriá" /></div><div className="citizen-auth-heading"><span>Portal do Cidadão</span><h2>{modo === 'login' ? 'Bem-vindo(a)' : titulo}</h2><p>{modo === 'login' ? <>Acesse sua conta para utilizar os serviços da<br /><strong>SMTT de Propriá.</strong></> : descricao}</p></div>
        {erro && <div className="citizen-auth-message is-error" role="alert"><AlertCircle size={18} /><span>{erro}</span></div>}
        {sucesso && <div className="citizen-auth-message is-success" role="status"><CheckCircle2 size={18} /><span>{sucesso}</span></div>}
        <form onSubmit={handleSubmit} className={`citizen-auth-form ${cadastro ? 'is-register' : ''}`}>
          {cadastro && <><FormField id="nome-completo" label="Nome completo" icon={User} className="is-full" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={150} required /><FormField id="email" label="E-mail" icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={100} required /><FormField id="telefone" label="Telefone" icon={Phone} value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))} maxLength={15} required /><FormField id="endereco" label="Endereço" icon={MapPin} className="is-full" value={endereco} onChange={(e) => setEndereco(e.target.value)} maxLength={255} required /></>}
          {(modo === 'esqueci' || modo === 'redefinir') && <FormField id="email-recuperacao" label="E-mail cadastrado" icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={100} required />}
          <FormField id="cpf" label={modo === 'login' ? 'Usuário' : 'CPF'} icon={modo === 'login' ? User : FileDigit} value={cpf} onChange={(e) => setCpf(formatCpf(e.target.value))} inputMode="numeric" maxLength={14} placeholder={modo === 'login' ? 'Digite seu usuário ou CPF' : '000.000.000-00'} required />
          {(modo === 'confirmar' || modo === 'redefinir') && <FormField id="codigo" label="Código de verificação" icon={ShieldCheck} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" minLength={6} maxLength={6} required />}
          {(modo === 'login' || cadastro) && <div className="citizen-auth-group"><label htmlFor="senha">Senha</label><div className="citizen-auth-field has-action"><Lock size={19} /><input id="senha" type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Digite sua senha" minLength={cadastro ? 8 : undefined} maxLength={128} required /><button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}>{mostrarSenha ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>{cadastro && <small>Use pelo menos 8 caracteres.</small>}</div>}
          {modo === 'redefinir' && <FormField id="nova-senha" label="Nova senha" icon={Lock} type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} minLength={8} maxLength={128} required />}
          {modo === 'login' && <button type="button" className="citizen-auth-forgot" onClick={() => trocarModo('esqueci')}>Esqueceu sua senha?</button>}
          <button type="submit" className="citizen-auth-submit is-full" disabled={enviando}>{enviando ? <LoaderCircle size={19} className="citizen-auth-spinner" /> : <ArrowRight size={19} />}{enviando ? 'Aguarde...' : (modo === 'login' ? 'Entrar' : titulo)}</button>
        </form>
        <div className="citizen-auth-switch">{modo === 'login' ? <button type="button" className="citizen-auth-create" onClick={() => trocarModo('cadastro')}><span><strong>Não tem uma conta?</strong> Saiba como acessar os serviços como cidadão.</span><ArrowRight size={18} /></button> : <button type="button" onClick={() => trocarModo('login')}>Voltar para o login</button>}</div>
        <footer className="citizen-auth-footer">SMTT — Superintendência Municipal de Transportes e Trânsito de Propriá/SE<br /><span>Trânsito mais seguro para todos</span></footer>
      </div>
    </section></main>
  </div>;
}

export default Login;

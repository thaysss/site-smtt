// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { User, Lock, Mail, Phone, MapPin, FileDigit } from 'lucide-react';

function Login() {
  const [isCadastro, setIsCadastro] = useState(false);
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const location = useLocation();
  const [erro, setErro] = useState(() => location.state?.mensagem || '');
  const [sucesso, setSucesso] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.mensagem) {
      // Limpa o state para não reexibir ao recarregar a página
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(''); setSucesso('');

    if (isCadastro) {
      try {
        await api.post('/auth/cadastro', { nome, cpf, email, senha, telefone, endereco });
        setSucesso('Conta criada com sucesso! Faça login para continuar.');
        setIsCadastro(false);
        setSenha('');
      } catch (error) {
        setErro(error.response?.data?.erro || 'Erro ao criar conta.');
      }
    } else {
      try {
        const response = await api.post('/auth/login', { cpf, senha });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('nomeUsuario', response.data.nome);
        navigate('/painel'); 
      } catch (error) {
        setErro(error.response?.data?.erro || 'CPF ou senha inválidos.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col selection:bg-primary-600 selection:text-white">
      
      {/* Header */}
      <header className="bg-white shadow-md py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo-horizontal.png" alt="Logo SMTT" className="h-10 w-auto object-contain" />
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-primary-600 flex items-center gap-1 transition-colors font-semibold"
          >
            <i className="fa-solid fa-arrow-left"></i> Voltar ao Início
          </button>
        </div>
      </header>

      {/* ÁREA CENTRAL DO FORMULÁRIO */}
      <div className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-md border border-gray-100 p-8">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-primary-600 mb-2">
              {isCadastro ? 'Criar sua Conta' : 'Acesso ao Cidadão'}
            </h2>
            <p className="text-gray-500 text-sm">
              {isCadastro ? 'Preencha seus dados reais para acessar os serviços' : 'Entre com seu CPF e senha para acessar o painel'}
            </p>
          </div>
          
          {erro && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 text-center border border-red-100 flex items-center justify-center gap-2 font-medium">{erro}</div>}
          {sucesso && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-6 text-center border border-green-100 flex items-center justify-center gap-2 font-medium">{sucesso}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* CAMPOS DE CADASTRO */}
            {isCadastro && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Nome Completo *</label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Seu nome" required />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Telefone *</label>
                    <div className="relative">
                      <Phone className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="(00) 00000" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">E-mail *</label>
                    <div className="relative">
                      <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="@email" required />
                    </div>
                  </div>
                </div>
 
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Endereço *</label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Rua, Número, Bairro" required />
                  </div>
                </div>
              </>
            )}
 
            {/* CAMPOS COMUNS (CPF E SENHA) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">CPF *</label>
              <div className="relative">
                <FileDigit className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" maxLength="11" value={cpf} onChange={(e) => setCpf(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Apenas números" required />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Senha *</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Sua senha" required />
              </div>
            </div>
            
            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:-translate-y-0.5 transition-all mt-4">
              {isCadastro ? 'Finalizar Cadastro' : 'Entrar no Painel'}
            </button>
          </form>
 
          {/* ALTERNADOR DE TELA */}
          <div className="text-center mt-8 pt-6 border-t border-gray-100 text-sm">
            {isCadastro ? (
              <span className="text-gray-500">Já possui conta? <button className="font-bold text-primary-600 hover:text-primary-800 transition-colors" onClick={() => { setIsCadastro(false); setErro(''); setSucesso(''); }}>Faça Login aqui</button></span>
            ) : (
              <span className="text-gray-500">Ainda não tem cadastro? <button className="font-bold text-primary-600 hover:text-primary-800 transition-colors" onClick={() => { setIsCadastro(true); setErro(''); setSucesso(''); }}>Crie sua conta</button></span>
            )}
          </div>
 
        </div>
      </div>
    </div>
  );
}

export default Login;
// src/pages/AdminLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { User, Lock, ArrowLeft } from 'lucide-react';

function AdminLogin() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      // Adicionamos o /auth aqui no começo do endereço
      const response = await api.post('/auth/admin/login', { usuario, senha });
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminNome', response.data.nome);
      navigate('/admin/infracoes');
    } catch (error) {
      setErro(error.response?.data?.erro || 'Credenciais inválidas.');
    }
  };

  return (
    <div className="min-h-screen bg-primary-900 font-sans text-gray-800 flex flex-col justify-center items-center selection:bg-secondary-500 selection:text-primary-950 p-4 relative overflow-hidden">
      
      {/* Padrão de Fundo Institucional */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
      
      <div className="w-full max-w-md relative z-10">
        
        {/* Botão Voltar */}
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-medium mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Portal Público
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 border-t-4 border-secondary-500 relative overflow-hidden">
          
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Logo SMTT" className="w-16 h-16 object-contain mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Acesso Restrito</h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">Portal do Servidor SMTT</p>
          </div>

          {erro && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 text-center border border-red-100 font-medium">{erro}</div>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Usuário / Matrícula</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Digite seu usuário" required />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Senha</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Sua senha de acesso" required />
              </div>
            </div>

            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all mt-2">
              Autenticar
            </button>
          </form>

        </div>
        
        <div className="text-center mt-6 text-gray-400 text-xs">
          Sistema de Gestão de Trânsito © 2026<br/>Acesso exclusivo para agentes autorizados.
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
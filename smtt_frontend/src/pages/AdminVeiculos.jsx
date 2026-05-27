// src/pages/AdminVeiculos.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Building2, LogOut, FileEdit, LayoutDashboard, 
  Car, AlertTriangle, ShieldAlert, CheckCircle, FileDigit, CarFront
} from 'lucide-react';

function AdminVeiculos() {
  const [placa, setPlaca] = useState('');
  const [renavam, setRenavam] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();
  const adminNome = localStorage.getItem('adminNome');

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) navigate('/admin/login');
    else api.defaults.headers.Authorization = `Bearer ${adminToken}`;
  }, [navigate]);

  const handleCadastrar = async (e) => {
    e.preventDefault();
    setMensagem(''); setErro('');
    try {
      const response = await api.post('/admin/veiculos', { placa, renavam });
      setMensagem(response.data.mensagem);
      setPlaca(''); setRenavam('');
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao cadastrar veículo.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminNome');
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 font-body text-gray-800 selection:bg-brand-blue selection:text-white">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-brand-dark text-white flex flex-col shadow-2xl z-20 hidden md:flex">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <Building2 className="text-accent-yellow w-8 h-8 shrink-0" />
          <div>
            <h2 className="font-sora font-bold text-lg leading-tight">SMTT Admin</h2>
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Portal do Servidor</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          <button onClick={() => navigate('/admin/painel')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <LayoutDashboard className="w-5 h-5" /> Recursos JARI
          </button>
          <button onClick={() => navigate('/admin/infracoes')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <FileEdit className="w-5 h-5" /> Lançar Infração
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold bg-brand-blue text-white rounded-xl shadow-md transition-colors border border-blue-600">
            <Car className="w-5 h-5 text-accent-yellow" /> Base de Veículos
          </button>
          <button onClick={() => navigate('/admin/alertas')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <AlertTriangle className="w-5 h-5" /> Avisos de Interdição
          </button>
        </nav>

        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="text-xs text-gray-400 mb-3">Agente:<br/><strong className="text-white text-sm">{adminNome}</strong></div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg transition-colors text-sm border border-red-500/20">
            Encerrar Sessão <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-sora font-bold text-gray-900 mb-2">Detran Municipal</h1>
          <p className="text-gray-500">Alimente a frota municipal para permitir autuações mais precisas.</p>
        </header>

        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8 max-w-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue to-blue-300"></div>

          {mensagem && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-200 flex items-start gap-3 font-medium"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />{mensagem}</div>}
          {erro && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-200 flex items-start gap-3 font-medium"><ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />{erro}</div>}

          <form onSubmit={handleCadastrar} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Placa Oficial *</label>
              <div className="relative">
                <CarFront className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" maxLength="7" placeholder="Ex: ABC1D23" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none uppercase font-bold text-gray-800 transition-all" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Código Renavam *</label>
              <div className="relative">
                <FileDigit className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" maxLength="11" placeholder="Somente números" value={renavam} onChange={(e) => setRenavam(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none font-medium text-gray-700 transition-all" />
              </div>
            </div>

            <button type="submit" className="w-full bg-brand-blue hover:bg-blue-800 text-white font-sora font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2 mt-6">
              <Car className="w-5 h-5" /> Cadastrar na Base
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AdminVeiculos;
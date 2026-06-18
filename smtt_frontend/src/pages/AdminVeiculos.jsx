// src/pages/AdminVeiculos.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Building2, LogOut, FileEdit, LayoutDashboard, 
  Car, AlertTriangle, ShieldAlert, CheckCircle, FileDigit, CarFront
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';

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
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 selection:bg-primary-600 selection:text-white">
      
      {/* Sidebar */}
      <AdminSidebar activeItem="veiculos" />

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Detran Municipal</h1>
          <p className="text-gray-500">Alimente a frota municipal para permitir autuações mais precisas.</p>
        </header>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 max-w-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-secondary-500"></div>

          {mensagem && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-200 flex items-start gap-3 font-medium"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />{mensagem}</div>}
          {erro && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-200 flex items-start gap-3 font-medium"><ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />{erro}</div>}

          <form onSubmit={handleCadastrar} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Placa Oficial *</label>
              <div className="relative">
                <CarFront className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" maxLength="7" placeholder="Ex: ABC1D23" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none uppercase font-bold text-gray-800 transition-all" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Código Renavam *</label>
              <div className="relative">
                <FileDigit className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" maxLength="11" placeholder="Somente números" value={renavam} onChange={(e) => setRenavam(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium text-gray-700 transition-all" />
              </div>
            </div>

            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2 mt-6">
              <Car className="w-5 h-5" /> Cadastrar na Base
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AdminVeiculos;
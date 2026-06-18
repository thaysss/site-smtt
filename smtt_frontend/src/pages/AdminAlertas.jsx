// src/pages/AdminAlertas.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Building2, LogOut, FileEdit, LayoutDashboard, 
  Car, AlertTriangle, ShieldAlert, CheckCircle, MapPin, AlignLeft, Trash2, TrafficCone
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';

function AdminAlertas() {
  const [ruaBairro, setRuaBairro] = useState('');
  const [descricao, setDescricao] = useState('');
  const [alertas, setAlertas] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const navigate = useNavigate();
  const adminNome = localStorage.getItem('adminNome');

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) navigate('/admin/login');
    else {
      api.defaults.headers.Authorization = `Bearer ${adminToken}`;
      carregarAlertas();
    }
  }, [navigate]);

  const carregarAlertas = async () => {
    try {
      const response = await api.get('/admin/alertas');
      setAlertas(response.data);
    } catch (error) {
      console.error("Erro ao carregar alertas:", error);
    }
  };

  const handleCriarAlerta = async (e) => {
    e.preventDefault();
    setMensagem('');
    try {
      await api.post('/admin/alertas', { rua_bairro: ruaBairro, descricao });
      setMensagem('Alerta publicado no portal público com sucesso!');
      setRuaBairro(''); setDescricao('');
      carregarAlertas();
    } catch (error) {
      alert('Erro ao criar alerta.');
    }
  };

  const handleResolverAlerta = async (id) => {
    if (!window.confirm("Deseja realmente marcar este alerta de trânsito como resolvido? Ele será retirado da página inicial pública.")) return;
    try {
      await api.put(`/admin/alertas/${id}/resolver`);
      setMensagem('Alerta marcado como resolvido com sucesso!');
      carregarAlertas();
    } catch (error) {
      console.error("Erro ao resolver alerta:", error);
      alert('Erro ao resolver alerta.');
    }
  };

  const handleExcluirAlerta = async (id) => {
    if (!window.confirm("Deseja realmente EXCLUIR PERMANENTEMENTE este alerta do banco de dados? Esta ação não pode ser desfeita.")) return;
    try {
      await api.delete(`/admin/alertas/${id}`);
      setMensagem('Alerta excluído permanentemente com sucesso!');
      carregarAlertas();
    } catch (error) {
      console.error("Erro ao excluir alerta:", error);
      alert('Erro ao excluir alerta permanentemente.');
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
      <AdminSidebar activeItem="alertas" />

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Comunicação Viária</h1>
          <p className="text-gray-500">Publique alertas de interdição, obras e acidentes que aparecerão no portal público.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Formulário */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
            <h3 className="font-bold text-lg mb-6 border-b border-gray-100 pb-3 flex items-center gap-2">
              <TrafficCone className="text-primary-600" /> Novo Alerta
            </h3>
            
            {mensagem && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm mb-5 border border-green-200 flex items-center gap-2 font-medium"><CheckCircle className="w-4 h-4" />{mensagem}</div>}

            <form onSubmit={handleCriarAlerta} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Local (Rua / Bairro) *</label>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Ex: Av. João Alves, Centro" value={ruaBairro} onChange={(e) => setRuaBairro(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Descrição do Ocorrido *</label>
                <div className="relative">
                  <AlignLeft className="w-5 h-5 absolute left-3 top-4 text-gray-400" />
                  <textarea rows="3" placeholder="Ex: Via parcialmente interditada devido a obras da DESO..." value={descricao} onChange={(e) => setDescricao(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none" />
                </div>
              </div>

              <button type="submit" className="w-full bg-secondary-500 hover:bg-secondary-600 text-primary-950 font-bold py-3.5 rounded-xl shadow-md transition-all mt-4">
                Publicar Alerta
              </button>
            </form>
          </div>

          {/* Lista de Alertas */}
          <div className="space-y-8">
            
            {/* Alertas Ativos */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
              <h3 className="font-bold text-lg mb-6 border-b border-gray-100 pb-3 flex items-center gap-2">
                <AlertTriangle className="text-red-500" /> Alertas Ativos
              </h3>

              {alertas.filter(a => a.status === 'Ativo').length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  Trânsito livre. Nenhum alerta ativo no momento.
                </div>
              ) : (
                <div className="space-y-4">
                  {alertas.filter(a => a.status === 'Ativo').map(alerta => (
                    <div key={alerta.id} className="p-4 border border-red-200 bg-red-50 rounded-xl flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-red-800 text-sm mb-1">{alerta.rua_bairro}</h4>
                        <p className="text-xs text-red-700 leading-relaxed">{alerta.descricao}</p>
                        <span className="text-[10px] uppercase font-bold text-red-400 mt-2 block">Status: {alerta.status}</span>
                      </div>
                      <button 
                        onClick={() => handleResolverAlerta(alerta.id)} 
                        className="bg-green-100 hover:bg-green-200 text-green-700 p-2.5 rounded-lg transition-colors flex items-center justify-center shrink-0" 
                        title="Marcar como Resolvido"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Histórico de Alertas Resolvidos */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
              <h3 className="font-bold text-lg mb-6 border-b border-gray-100 pb-3 flex items-center gap-2">
                <CheckCircle className="text-green-600" /> Histórico de Alertas Resolvidos
              </h3>

              {alertas.filter(a => a.status === 'Resolvido').length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  Nenhum alerta arquivado no histórico.
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {alertas.filter(a => a.status === 'Resolvido').map(alerta => (
                    <div key={alerta.id} className="p-4 border border-gray-200 bg-gray-50/70 rounded-xl flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-750 text-sm mb-1">{alerta.rua_bairro}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">{alerta.descricao}</p>
                        <span className="text-[10px] uppercase font-bold text-gray-450 mt-2 block">Status: {alerta.status}</span>
                      </div>
                      <button 
                        onClick={() => handleExcluirAlerta(alerta.id)} 
                        className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-lg transition-colors shrink-0" 
                        title="Excluir Permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

export default AdminAlertas;
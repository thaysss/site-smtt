// src/pages/AdminPainel.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Building2, LogOut, FileEdit, LayoutDashboard, 
  Car, AlertTriangle, CheckCircle, XCircle, FileText
} from 'lucide-react';

function AdminPainel() {
  const [recursos, setRecursos] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [justificativaJari, setJustificativaJari] = useState('');
  const [recursoFoco, setRecursoFoco] = useState(null);
  
  const navigate = useNavigate();
  const adminNome = localStorage.getItem('adminNome');

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    api.defaults.headers.Authorization = `Bearer ${adminToken}`;
    carregarRecursos();
  }, [navigate]);

  const carregarRecursos = async () => {
    try {
      const response = await api.get('/admin/recursos');
      setRecursos(response.data);
    } catch (error) {
      console.error("Erro ao carregar recursos", error);
    }
  };

  const julgarRecurso = async (id, decisao) => {
    if (!justificativaJari) {
      alert("Digite o parecer técnico antes de julgar.");
      return;
    }
    try {
      await api.put(`/admin/recursos/${id}/julgar`, {
        decisao: decisao,
        justificativa_jari: justificativaJari
      });
      setMensagem(`Recurso ${decisao} com sucesso!`);
      setJustificativaJari('');
      setRecursoFoco(null);
      carregarRecursos();
    } catch (error) {
      alert("Erro ao julgar recurso.");
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
          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold bg-brand-blue text-white rounded-xl shadow-md transition-colors border border-blue-600">
            <LayoutDashboard className="w-5 h-5 text-accent-yellow" /> Recursos JARI
          </button>
          <button onClick={() => navigate('/admin/infracoes')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <FileEdit className="w-5 h-5" /> Lançar Infração
          </button>
          <button onClick={() => navigate('/admin/veiculos')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <Car className="w-5 h-5" /> Base de Veículos
          </button>
          <button onClick={() => navigate('/admin/alertas')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <AlertTriangle className="w-5 h-5" /> Avisos de Interdição
          </button>
        </nav>

        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="text-xs text-gray-400 mb-3">Agente Autuador:<br/><strong className="text-white text-sm">{adminNome}</strong></div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg transition-colors text-sm border border-red-500/20">
            Encerrar Sessão <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-sora font-bold text-gray-900 mb-2">Julgamento JARI</h1>
          <p className="text-gray-500">Analise e julgue os recursos de multas enviados pelos cidadãos.</p>
        </header>

        {mensagem && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-200 flex items-start gap-3 font-medium"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />{mensagem}</div>}

        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8">
          {recursos.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-sora font-bold text-lg text-gray-600">Nenhum recurso pendente</p>
            </div>
          ) : (
            <div className="space-y-6">
              {recursos.map((rec) => (
                <div key={rec.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-gray-50">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-brand-dark mb-1">Protocolo: <span className="text-brand-blue">{rec.protocolo?.numero_protocolo}</span></h3>
                      <p className="text-sm text-gray-600">AIT: <strong>{rec.infracao?.numero_ait}</strong> | Placa: <strong>{rec.infracao?.placa_veiculo}</strong></p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200">
                      {rec.resultado_julgamento}
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 text-sm text-gray-700 italic">
                    "Recurso anexado via formulário padrão. Arquivo físico/digital em anexo no protocolo."
                  </div>

                  {rec.resultado_julgamento === 'Em Análise' && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Parecer da JARI (Justificativa)</label>
                      <textarea 
                        rows="3" 
                        placeholder="Digite o embasamento legal para o deferimento ou indeferimento..."
                        value={recursoFoco === rec.id ? justificativaJari : ''}
                        onChange={(e) => { setJustificativaJari(e.target.value); setRecursoFoco(rec.id); }}
                        className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none transition-all mb-3 resize-none"
                      />
                      <div className="flex gap-3">
                        <button onClick={() => julgarRecurso(rec.id, 'Deferido')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                          <CheckCircle className="w-4 h-4" /> Deferir (Aceitar)
                        </button>
                        <button onClick={() => julgarRecurso(rec.id, 'Indeferido')} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                          <XCircle className="w-4 h-4" /> Indeferir (Negar)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminPainel;
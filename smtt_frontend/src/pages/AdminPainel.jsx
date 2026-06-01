// src/pages/AdminPainel.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Building2, LogOut, FileEdit, LayoutDashboard, 
  Car, AlertTriangle, CheckCircle, XCircle, FileText, Paperclip, Upload,
  Layers
} from 'lucide-react';

const apiBaseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
const montarUrlArquivo = (caminho) => {
  if (!caminho) return '';
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return `${apiBaseUrl}${caminho}`;
};

function AdminPainel() {
  const [recursos, setRecursos] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [justificativaJari, setJustificativaJari] = useState('');
  const [recursoFoco, setRecursoFoco] = useState(null);
  
  // Novo estado para guardar o arquivo de resposta do agente
  const [arquivoResposta, setArquivoResposta] = useState(null);
  
  // Estado para filtragem por tipo de recurso (Padrão: Todos)
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  
  const navigate = useNavigate();
  const adminNome = localStorage.getItem('adminNome');

  const tiposRecurso = ['Todos', 'Defesa Prévia', 'Recurso JARI', 'Indicação de Real Infrator'];

  const normalizeString = (str) => {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  };

  const countPendentes = (tipo) => {
    if (tipo === 'Todos') {
      return recursos.filter((rec) => rec.resultado_julgamento === 'Em Análise').length;
    }
    const normalizedTipo = normalizeString(tipo);
    return recursos.filter(
      (rec) => normalizeString(rec.tipo_recurso || 'Defesa Prévia') === normalizedTipo && rec.resultado_julgamento === 'Em Análise'
    ).length;
  };

  const recursosFiltrados = recursos.filter((rec) => {
    if (filtroTipo === 'Todos') return true;
    return normalizeString(rec.tipo_recurso || 'Defesa Prévia') === normalizeString(filtroTipo);
  });

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
      const formData = new FormData();
      formData.append('decisao', decisao);
      formData.append('justificativa_jari', justificativaJari);
      if (arquivoResposta) {
        formData.append('arquivo_resposta', arquivoResposta);
      }

      await api.put(`/admin/recursos/${id}/julgar`, formData);
      
      setMensagem(`Recurso ${decisao} com sucesso! O cidadão já pode ver a resposta.`);
      setJustificativaJari('');
      setArquivoResposta(null); // Limpa o arquivo selecionado
      setRecursoFoco(null);
      carregarRecursos();
    } catch {
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
      
      {/* SIDEBAR MANTIDA IGUAL */}
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
            <LayoutDashboard className="w-5 h-5 text-accent-yellow" /> Recursos 
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
          <h1 className="text-3xl font-sora font-bold text-gray-900 mb-2">Julgamento </h1>
          <p className="text-gray-500">Analise os anexos e julgue os recursos de multas enviados pelos cidadãos.</p>
        </header>

        {mensagem && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-200 flex items-start gap-3 font-medium"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />{mensagem}</div>}

        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8">
          
          {/* ABAS DE CATEGORIA */}
          <div className="flex border-b border-gray-100 pb-4 mb-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 gap-2">
            {tiposRecurso.map((tipo) => {
              const ativo = filtroTipo === tipo;
              const pendentes = countPendentes(tipo);
              return (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 shrink-0 ${
                    ativo 
                      ? 'bg-blue-50 text-brand-blue border border-blue-100 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/70 border border-transparent'
                  }`}
                >
                  <Layers className={`w-4 h-4 transition-transform duration-200 ${ativo ? 'text-brand-blue scale-110' : 'text-gray-400'}`} />
                  <span>{tipo}</span>
                  {pendentes > 0 ? (
                    <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-brand-blue text-white text-[10px] font-extrabold shadow-sm animate-pulse">
                      {pendentes}
                    </span>
                  ) : (
                    <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 text-[10px] font-bold">
                      0
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {recursosFiltrados.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 mb-3 text-gray-300 stroke-[1.5]" />
              <p className="font-sora font-bold text-base text-gray-600 mb-1">Nenhum processo pendente</p>
              <p className="text-xs text-gray-400 font-medium">Não há requerimentos do tipo "{filtroTipo}" cadastrados ou pendentes de análise.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {recursosFiltrados.map((rec) => (
                <div key={rec.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-gray-50">
                  
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-lg text-brand-dark">Protocolo: <span className="text-brand-blue">{rec.protocolo?.numero_protocolo}</span></h3>
                        <span className="text-[10px] bg-blue-50 text-brand-blue border border-blue-100 font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wide">
                          {rec.tipo_recurso || 'Defesa Prévia'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">AIT: <strong>{rec.infracao?.numero_ait}</strong> | Placa: <strong>{rec.infracao?.placa_veiculo}</strong></p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200">
                      {rec.resultado_julgamento}
                    </span>
                  </div>

                  {/* CAIXA DE VISUALIZAÇÃO DOS ANEXOS DO CIDADÃO */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 mb-4 space-y-3">
                    <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Documentos Anexados pelo Cidadão</p>
                    
                    <div className="flex flex-col gap-2.5">
                      {/* Formulário Principal */}
                      {rec.arquivo_recurso_cidadao ? (
                        <a 
                          href={montarUrlArquivo(rec.arquivo_recurso_cidadao)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-between p-3 rounded-xl border text-brand-blue bg-blue-50/40 hover:bg-blue-50 border-blue-200 transition-all text-sm font-bold shadow-sm"
                        >
                          <span className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-brand-blue" />
                            Formulário Principal do Recurso
                          </span>
                          <span className="text-[10px] bg-brand-blue text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Principal</span>
                        </a>
                      ) : (
                        <div className="p-3 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl text-sm font-medium italic flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-400" /> Nenhum formulário principal anexado
                        </div>
                      )}
                      
                      {/* Documentos Adicionais */}
                      {rec.anexos && rec.anexos.length > 0 && (
                        <div className="mt-1 space-y-2">
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Documentos Adicionais ({rec.anexos.length})</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {rec.anexos.map((anexo, idx) => (
                              <a 
                                key={idx}
                                href={montarUrlArquivo(anexo.caminho_arquivo)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-between p-3 rounded-xl border text-gray-700 bg-gray-50/50 hover:bg-gray-50 border-gray-200 hover:border-gray-300 transition-all text-xs font-semibold shadow-sm truncate"
                              >
                                <span className="flex items-center gap-2 text-gray-700 truncate max-w-[200px]">
                                  <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  {anexo.nome_original || `Documento Anexo ${idx + 1}`}
                                </span>
                                <span className="text-[10px] text-brand-blue font-bold hover:underline shrink-0">Visualizar</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ÁREA DE JULGAMENTO (Justificativa + Anexo de Resposta) */}
                  {rec.resultado_julgamento === 'Em Análise' && (
                    <div className="border-t border-gray-200 pt-5 mt-4">
                      
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Parecer Técnico da JARI *</label>
                      <textarea 
                        rows="3" 
                        placeholder="Digite o embasamento legal para a decisão..."
                        value={recursoFoco === rec.id ? justificativaJari : ''}
                        onChange={(e) => { setJustificativaJari(e.target.value); setRecursoFoco(rec.id); }}
                        className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none transition-all mb-4 resize-none text-sm"
                      />

                      {/* NOVO CAMPO: ANEXAR RESPOSTA DA JARI */}
                      <div className="mb-5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                          <Upload className="w-4 h-4 text-gray-500" /> Anexar Ofício de Resposta (Opcional)
                        </label>
                        <input 
                          type="file" 
                          onChange={(e) => setArquivoResposta(e.target.files[0])}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 border border-gray-200 rounded-xl p-2 bg-white transition-all cursor-pointer"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button onClick={() => julgarRecurso(rec.id, 'Deferido')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                          <CheckCircle className="w-5 h-5" /> Deferir (Aceitar Defesa)
                        </button>
                        <button onClick={() => julgarRecurso(rec.id, 'Indeferido')} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                          <XCircle className="w-5 h-5" /> Indeferir (Manter Multa)
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

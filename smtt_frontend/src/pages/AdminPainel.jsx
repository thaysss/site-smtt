// src/pages/AdminPainel.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Building2, LogOut, FileEdit, LayoutDashboard, 
  Car, AlertTriangle, CheckCircle, XCircle, FileText, Paperclip, Upload,
  Layers, Calendar
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

  // NOVOS ESTADOS PARA EVENTOS E INFRAÇÕES
  const [menuAtivo, setMenuAtivo] = useState(() => localStorage.getItem('adminMenuAtivo') || 'recursos'); // 'recursos', 'eventos' ou 'infracoes'
  const [eventos, setEventos] = useState([]);
  const [eventoFoco, setEventoFoco] = useState(null);
  const [justificativaEvento, setJustificativaEvento] = useState('');
  const [infracoes, setInfracoes] = useState([]);
  const [filtroInfracao, setFiltroInfracao] = useState('');
  const [infracaoAberta, setInfracaoAberta] = useState(null);
  const [alvaras, setAlvaras] = useState([]);
  const [justificativaAlvara, setJustificativaAlvara] = useState('');
  const [alvaraFoco, setAlvaraFoco] = useState(null);
  const [alvaraArquivoEmitido, setAlvaraArquivoEmitido] = useState(null);

  // ESTADOS DO SISTEMA DE NOTÍCIAS
  const [noticias, setNoticias] = useState([]);
  const [noticiaFoco, setNoticiaFoco] = useState(null);
  const [tituloNews, setTituloNews] = useState('');
  const [subtituloNews, setSubtituloNews] = useState('');
  const [conteudoNews, setConteudoNews] = useState('');
  const [categoriaNews, setCategoriaNews] = useState('Geral');
  const [imagemNews, setImagemNews] = useState(null);
  const [modoEdicaoNews, setModoEdicaoNews] = useState(false);
  const [exibindoFormNews, setExibindoFormNews] = useState(false);

  // ESTADOS DO SISTEMA DE ESTATÍSTICAS
  const [estatisticas, setEstatisticas] = useState([]);
  const [estFoco, setEstFoco] = useState(null);
  const [tituloEst, setTituloEst] = useState('');
  const [valorEst, setValorEst] = useState('');
  const [iconeEst, setIconeEst] = useState('fa-chart-simple');
  const [ordemEst, setOrdemEst] = useState(0);
  const [modoEdicaoEst, setModoEdicaoEst] = useState(false);
  const [exibindoFormEst, setExibindoFormEst] = useState(false);
  
  const navigate = useNavigate();
  const adminNome = localStorage.getItem('adminNome');

  const handleMenuClick = (aba) => {
    setMenuAtivo(aba);
    localStorage.setItem('adminMenuAtivo', aba);
  };

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

  const normalizePlacaOuAit = (str) => {
    if (!str) return '';
    return str.toUpperCase().replace(/[- ]/g, '').trim();
  };

  const infracoesFiltradas = infracoes.filter((inf) => {
    if (!filtroInfracao) return true;
    const busca = normalizePlacaOuAit(filtroInfracao);
    const placaInf = normalizePlacaOuAit(inf.veiculo?.placa);
    const aitInf = normalizePlacaOuAit(inf.numero_ait);
    return placaInf.includes(busca) || aitInf.includes(busca);
  });

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    api.defaults.headers.Authorization = `Bearer ${adminToken}`;
    carregarRecursos();
    carregarEventos();
    carregarAlvaras();
    carregarInfracoes();
    carregarNoticias();
    carregarEstatisticas();
  }, [navigate]);

  const carregarRecursos = async () => {
    try {
      const response = await api.get('/admin/recursos');
      setRecursos(response.data);
    } catch (error) {
      console.error("Erro ao carregar recursos", error);
    }
  };

  const carregarEventos = async () => {
    try {
      const response = await api.get('/admin/eventos');
      setEventos(response.data);
    } catch (error) {
      console.error("Erro ao carregar eventos", error);
    }
  };

  const carregarAlvaras = async () => {
    try {
      const response = await api.get('/admin/alvaras');
      setAlvaras(response.data);
    } catch (error) {
      console.error("Erro ao carregar alvarás", error);
    }
  };

  const carregarInfracoes = async () => {
    try {
      const response = await api.get('/admin/infracoes');
      setInfracoes(response.data);
    } catch (error) {
      console.error("Erro ao carregar infrações", error);
    }
  };

  const carregarNoticias = async () => {
    try {
      const response = await api.get('/admin/noticias');
      setNoticias(response.data);
    } catch (error) {
      console.error("Erro ao carregar notícias", error);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      const response = await api.get('/admin/estatisticas');
      setEstatisticas(response.data);
    } catch (error) {
      console.error("Erro ao carregar estatísticas", error);
    }
  };

  const prepararCadastroEst = () => {
    setEstFoco(null);
    setTituloEst('');
    setValorEst('');
    setIconeEst('fa-chart-simple');
    setOrdemEst(0);
    setModoEdicaoEst(false);
    setExibindoFormEst(true);
  };

  const prepararEdicaoEst = (est) => {
    setEstFoco(est);
    setTituloEst(est.titulo);
    setValorEst(est.valor);
    setIconeEst(est.icone || 'fa-chart-simple');
    setOrdemEst(est.ordem || 0);
    setModoEdicaoEst(true);
    setExibindoFormEst(true);
  };

  const salvarEstatistica = async (e) => {
    e.preventDefault();
    setMensagem("");
    
    const payload = {
      titulo: tituloEst,
      valor: valorEst,
      icone: iconeEst,
      ordem: parseInt(ordemEst) || 0
    };
    
    try {
      if (modoEdicaoEst && estFoco) {
        await api.put(`/admin/estatisticas/${estFoco.id}`, payload);
        setMensagem("Estatística editada com sucesso!");
      } else {
        await api.post('/admin/estatisticas', payload);
        setMensagem("Estatística cadastrada com sucesso!");
      }
      
      setExibindoFormEst(false);
      setEstFoco(null);
      setTituloEst('');
      setValorEst('');
      setIconeEst('fa-chart-simple');
      setOrdemEst(0);
      carregarEstatisticas();
    } catch (error) {
      console.error("Erro ao salvar estatística", error);
      alert(error.response?.data?.erro || "Erro ao salvar a estatística.");
    }
  };

  const deletarEstatistica = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta estatística? Ela deixará de aparecer na página inicial.")) return;
    try {
      await api.delete(`/admin/estatisticas/${id}`);
      setMensagem("Estatística excluída com sucesso!");
      carregarEstatisticas();
    } catch (error) {
      console.error("Erro ao excluir estatística", error);
      alert("Erro ao excluir a estatística.");
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

  const julgarEvento = async (id, decisao) => {
    if (!justificativaEvento) {
      alert("Digite o parecer técnico antes de decidir.");
      return;
    }
    
    try {
      await api.put(`/admin/eventos/${id}/julgar`, {
        decisao,
        justificativa_jari: justificativaEvento
      });
      
      setMensagem(`Solicitação de evento ${decisao === 'Aprovado' ? 'aprovada' : 'negada'} com sucesso!`);
      setJustificativaEvento('');
      setEventoFoco(null);
      carregarEventos();
    } catch {
      alert("Erro ao julgar solicitação de evento.");
    }
  };

  const julgarAlvara = async (id, decisao) => {
    if (!justificativaAlvara) {
      alert("Digite o parecer técnico antes de decidir.");
      return;
    }

    if (decisao === 'Aprovado' && !alvaraArquivoEmitido) {
      alert("Por favor, anexe o documento do Alvará Emitido antes de aprovar.");
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('decisao', decisao);
      formData.append('justificativa_jari', justificativaAlvara);
      if (alvaraArquivoEmitido) {
        formData.append('arquivo_alvara', alvaraArquivoEmitido);
      }

      await api.put(`/admin/alvaras/${id}/julgar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMensagem(`Solicitação de alvará/permissionário ${decisao === 'Aprovado' ? 'aprovada' : 'negada'} com sucesso!`);
      setJustificativaAlvara('');
      setAlvaraArquivoEmitido(null);
      setAlvaraFoco(null);
      carregarAlvaras();
    } catch {
      alert("Erro ao julgar solicitação de alvará.");
    }
  };

  const limparFormNoticia = () => {
    setNoticiaFoco(null);
    setTituloNews('');
    setSubtituloNews('');
    setConteudoNews('');
    setCategoriaNews('Geral');
    setImagemNews(null);
    setModoEdicaoNews(false);
    setExibindoFormNews(false);
  };

  const prepararEdicaoNoticia = (n) => {
    setNoticiaFoco(n);
    setTituloNews(n.titulo);
    setSubtituloNews(n.subtitulo || '');
    setConteudoNews(n.conteudo);
    setCategoriaNews(n.categoria || 'Geral');
    setImagemNews(null);
    setModoEdicaoNews(true);
    setExibindoFormNews(true);
  };

  const salvarNoticia = async (e) => {
    e.preventDefault();
    if (!tituloNews || !conteudoNews) {
      alert("Título e Conteúdo são obrigatórios.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('titulo', tituloNews);
      formData.append('subtitulo', subtituloNews);
      formData.append('conteudo', conteudoNews);
      formData.append('categoria', categoriaNews);
      if (imagemNews) {
        formData.append('imagem', imagemNews);
      }

      if (modoEdicaoNews && noticiaFoco) {
        await api.put(`/admin/noticias/${noticiaFoco.id}`, formData);
        setMensagem("Notícia atualizada com sucesso!");
      } else {
        await api.post('/admin/noticias', formData);
        setMensagem("Notícia publicada com sucesso!");
      }

      limparFormNoticia();
      carregarNoticias();
    } catch (error) {
      console.error("Erro ao salvar notícia", error);
      alert(error.response?.data?.erro || "Erro ao salvar a notícia.");
    }
  };

  const deletarNoticia = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta notícia?")) return;

    try {
      await api.delete(`/admin/noticias/${id}`);
      setMensagem("Notícia excluída com sucesso!");
      carregarNoticias();
    } catch (error) {
      console.error("Erro ao excluir notícia", error);
      alert("Erro ao excluir a notícia.");
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
      <aside className="w-64 bg-primary-900 text-white flex flex-col shadow-2xl z-20 hidden md:flex">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <img src="/logon.png" alt="Logo SMTT" className="w-10 h-10 object-contain shrink-0" />
          <div>
            <h2 className="font-bold text-lg leading-tight">SMTT Admin</h2>
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Portal do Servidor</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          <button 
            onClick={() => handleMenuClick('recursos')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-colors border text-left ${
              menuAtivo === 'recursos' 
                ? 'bg-primary-600 text-white shadow-md border-primary-700' 
                : 'text-gray-300 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            <i className={`fa-solid fa-folder-open w-5 text-center ${menuAtivo === 'recursos' ? 'text-secondary-500' : 'text-gray-400'}`}></i> Recursos 
          </button>
          <button 
            onClick={() => handleMenuClick('eventos')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-colors border text-left ${
              menuAtivo === 'eventos' 
                ? 'bg-primary-600 text-white shadow-md border-primary-700' 
                : 'text-gray-300 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            <i className={`fa-solid fa-calendar-days w-5 text-center ${menuAtivo === 'eventos' ? 'text-secondary-500' : 'text-gray-400'}`}></i> Eventos
          </button>
          <button 
            onClick={() => handleMenuClick('alvaras')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-colors border text-left ${
              menuAtivo === 'alvaras' 
                ? 'bg-primary-600 text-white shadow-md border-primary-700' 
                : 'text-gray-300 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            <i className={`fa-solid fa-id-card-clip w-5 text-center ${menuAtivo === 'alvaras' ? 'text-secondary-500' : 'text-gray-400'}`}></i> Alvarás
          </button>
          <button 
            onClick={() => handleMenuClick('infracoes')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-colors border text-left ${
              menuAtivo === 'infracoes' 
                ? 'bg-primary-600 text-white shadow-md border-primary-700' 
                : 'text-gray-300 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            <i className={`fa-solid fa-list-check w-5 text-center ${menuAtivo === 'infracoes' ? 'text-secondary-500' : 'text-gray-400'}`}></i> Infrações Lançadas
          </button>
          <button 
            onClick={() => handleMenuClick('noticias')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-colors border text-left ${
              menuAtivo === 'noticias' 
                ? 'bg-primary-600 text-white shadow-md border-primary-700' 
                : 'text-gray-300 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            <i className={`fa-solid fa-newspaper w-5 text-center ${menuAtivo === 'noticias' ? 'text-secondary-500' : 'text-gray-400'}`}></i> Notícias
          </button>
          <button 
            onClick={() => handleMenuClick('estatisticas')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-colors border text-left ${
              menuAtivo === 'estatisticas' 
                ? 'bg-primary-600 text-white shadow-md border-primary-700' 
                : 'text-gray-300 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            <i className={`fa-solid fa-chart-line w-5 text-center ${menuAtivo === 'estatisticas' ? 'text-secondary-500' : 'text-gray-400'}`}></i> Estatísticas
          </button>
          <button onClick={() => navigate('/admin/infracoes')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left border border-transparent">
            <i className="fa-solid fa-file-signature w-5 text-center text-gray-400"></i> Lançar Infração
          </button>
          <button onClick={() => navigate('/admin/veiculos')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left border border-transparent">
            <i className="fa-solid fa-car w-5 text-center text-gray-400"></i> Base de Veículos
          </button>
          <button onClick={() => navigate('/admin/alertas')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left border border-transparent">
            <i className="fa-solid fa-triangle-exclamation w-5 text-center text-gray-400"></i> Avisos de Interdição
          </button>
        </nav>

        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="text-xs text-gray-400 mb-3">Agente Autuador:<br/><strong className="text-white text-sm">{adminNome}</strong></div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg transition-colors text-sm border border-red-500/20">
            Encerrar Sessão <i className="fa-solid fa-right-from-bracket text-xs"></i>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        {menuAtivo === 'recursos' ? (
          <>
            <header className="mb-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Julgamento de Recursos</h1>
              <p className="text-gray-500">Analise os anexos e julgue os recursos de multas enviados pelos cidadãos.</p>
            </header>

            {mensagem && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-200 flex items-start gap-3 font-medium"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />{mensagem}</div>}

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
              
              {/* ABAS DE CATEGORIA */}
              <div className="flex border-b border-gray-100 pb-4 mb-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 gap-2">
                {tiposRecurso.map((tipo) => {
                  const ativo = filtroTipo === tipo;
                  const fontPeso = ativo ? 'font-bold' : 'font-semibold';
                  const pendentes = countPendentes(tipo);
                  return (
                    <button
                      key={tipo}
                      onClick={() => setFiltroTipo(tipo)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 shrink-0 ${fontPeso} ${
                        ativo 
                          ? 'bg-blue-50 text-primary-600 border border-blue-100 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/70 border border-transparent'
                      }`}
                    >
                      <Layers className={`w-4 h-4 transition-transform duration-200 ${ativo ? 'text-primary-600 scale-110' : 'text-gray-400'}`} />
                      <span>{tipo}</span>
                      {pendentes > 0 ? (
                        <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-extrabold shadow-sm animate-pulse">
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
                  <p className="font-bold text-base text-gray-600 mb-1">Nenhum processo pendente</p>
                  <p className="text-xs text-gray-400 font-medium">Não há requerimentos do tipo "{filtroTipo}" cadastrados ou pendentes de análise.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {recursosFiltrados.map((rec) => (
                    <div key={rec.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-gray-50">
                      
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="font-bold text-lg text-primary-900">Protocolo: <span className="text-primary-600">{rec.protocolo?.numero_protocolo}</span></h3>
                            <span className="text-[10px] bg-blue-50 text-primary-600 border border-blue-100 font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wide">
                              {rec.tipo_recurso || 'Defesa Prévia'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">AIT: <strong>{rec.infracao?.numero_ait}</strong> | Placa: <strong>{rec.infracao?.placa_veiculo}</strong></p>
                        </div>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200">
                          {rec.resultado_julgamento}
                        </span>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-gray-200 mb-4 space-y-3">
                        <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Documentos Anexados pelo Cidadão</p>
                        
                        <div className="flex flex-col gap-2.5">
                          {rec.arquivo_recurso_cidadao ? (
                            <a 
                              href={montarUrlArquivo(rec.arquivo_recurso_cidadao)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-between p-3 rounded-xl border text-primary-600 bg-blue-50/40 hover:bg-blue-50 border-blue-200 transition-all text-sm font-bold shadow-sm"
                            >
                              <span className="flex items-center gap-2.5">
                                <FileText className="w-4 h-4 text-primary-600" />
                                Formulário Principal do Recurso
                              </span>
                              <span className="text-[10px] bg-primary-600 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Principal</span>
                            </a>
                          ) : (
                            <div className="p-3 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl text-sm font-medium italic flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-400" /> Nenhum formulário principal anexado
                            </div>
                          )}
                          
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
                                    <span className="text-[10px] text-primary-600 font-bold hover:underline shrink-0">Visualizar</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {rec.resultado_julgamento === 'Em Análise' && (
                        <div className="border-t border-gray-200 pt-5 mt-4">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Parecer Técnico da JARI *</label>
                          <textarea 
                            rows="3" 
                            placeholder="Digite o embasamento legal para a decisão..."
                            value={recursoFoco === rec.id ? justificativaJari : ''}
                            onChange={(e) => { setJustificativaJari(e.target.value); setRecursoFoco(rec.id); }}
                            className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all mb-4 resize-none text-sm"
                          />

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
          </>
        ) : menuAtivo === 'eventos' ? (
          <>
            <header className="mb-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Solicitações de Eventos</h1>
              <p className="text-gray-500">Analise os pedidos de interdição de via e emita a resposta técnica da SMTT.</p>
            </header>

            {mensagem && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-200 flex items-start gap-3 font-medium"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />{mensagem}</div>}

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
              {eventos.length === 0 ? (
                <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                  <Calendar className="w-12 h-12 mb-3 text-gray-300 stroke-[1.5]" />
                  <p className="font-bold text-base text-gray-600 mb-1">Nenhuma solicitação pendente</p>
                  <p className="text-xs text-gray-400 font-medium">Não há requerimentos de eventos cadastrados.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {eventos.map((eve) => (
                    <div key={eve.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-gray-50">
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="font-bold text-lg text-primary-900">Protocolo: <span className="text-primary-600">{eve.numero_protocolo}</span></h3>
                            <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-100 font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wide">
                              Evento
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Solicitante: <strong>{eve.nome_solicitante}</strong> | CPF/CNPJ: <strong>{eve.cpf_cnpj}</strong> | Tel: <strong>{eve.telefone}</strong></p>
                          <p className="text-sm text-gray-600">E-mail: <strong>{eve.email}</strong></p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          eve.status === 'Aprovado' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : eve.status === 'Negado'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
                          {eve.status}
                        </span>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-gray-200 mb-4 space-y-3">
                        <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Dados da Interdição</p>
                        <p className="text-sm text-gray-800">Data e Horário: <strong>{eve.data_evento}</strong></p>
                        <p className="text-sm text-gray-800">Local e Vias: <strong>{eve.local_evento}</strong></p>
                        {eve.descricao && <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">"{eve.descricao}"</p>}
                        
                        <div className="pt-2">
                          <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Requerimento Anexo</p>
                          <a 
                            href={montarUrlArquivo(eve.caminho_arquivo)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-between p-3 rounded-xl border text-primary-600 bg-blue-50/40 hover:bg-blue-50 border-blue-200 transition-all text-sm font-bold shadow-sm"
                          >
                            <span className="flex items-center gap-2.5">
                              <FileText className="w-4 h-4 text-primary-600" />
                              Visualizar PDF do Requerimento
                            </span>
                          </a>
                        </div>
                      </div>

                      {eve.status === 'Em Análise' ? (
                        <div className="border-t border-gray-200 pt-5 mt-4">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Parecer Técnico SMTT *</label>
                          <textarea 
                            rows="3" 
                            placeholder="Escreva o parecer técnico sobre a autorização de trânsito para o evento..."
                            value={eventoFoco === eve.id ? justificativaEvento : ''}
                            onChange={(e) => { setJustificativaEvento(e.target.value); setEventoFoco(eve.id); }}
                            className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all mb-4 resize-none text-sm"
                          />
                          <div className="flex gap-3">
                            <button onClick={() => julgarEvento(eve.id, 'Aprovado')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                              <CheckCircle className="w-5 h-5" /> Autorizar / Aprovar Pedido
                            </button>
                            <button onClick={() => julgarEvento(eve.id, 'Negado')} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                              <XCircle className="w-5 h-5" /> Negar Pedido
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-t border-gray-200 pt-4 mt-4 text-sm text-gray-600 bg-gray-100/50 p-4 rounded-xl">
                          <strong>Parecer Técnico:</strong> <span className="italic">"{eve.resposta_analise}"</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : menuAtivo === 'alvaras' ? (
          <>
            <header className="mb-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Solicitações de Alvarás e Permissionários</h1>
              <p className="text-gray-500">Analise os requerimentos de emissão/renovação de alvará e inclusão de permissionários.</p>
            </header>

            {mensagem && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-200 flex items-start gap-3 font-medium"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />{mensagem}</div>}

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
              {alvaras.length === 0 ? (
                <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                  <FileText className="w-12 h-12 mb-3 text-gray-300 stroke-[1.5]" />
                  <p className="font-bold text-base text-gray-600 mb-1">Nenhuma solicitação pendente</p>
                  <p className="text-xs text-gray-400 font-medium">Não há requerimentos de alvará/permissionário cadastrados.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {alvaras.map((alv) => (
                    <div key={alv.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-gray-50">
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="font-bold text-lg text-primary-900">Protocolo: <span className="text-primary-600">{alv.numero_protocolo}</span></h3>
                            <span className={`text-[10px] border font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wide ${
                              alv.tipo_servico === 'Renovação de Alvará'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : 'bg-teal-50 text-teal-700 border-teal-100'
                            }`}>
                              {alv.tipo_servico}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Requerente: <strong>{alv.nome_solicitante}</strong> | CPF: <strong>{alv.cpf}</strong> | Tel: <strong>{alv.telefone}</strong></p>
                          <p className="text-sm text-gray-600">E-mail: <strong>{alv.email}</strong> | Placa: <strong>{alv.placa_veiculo || 'Não informada'}</strong> | Fator RH: <strong>{alv.fator_rh || 'Não informado'}</strong></p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          alv.status === 'Aprovado' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : alv.status === 'Negado'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
                          {alv.status}
                        </span>
                      </div>

                      {alv.tem_auxiliar && (
                        <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100 mb-4">
                          <p className="text-xs uppercase tracking-wider text-blue-600 font-bold mb-1.5"><i className="fa-solid fa-user-shield"></i> Condutor Auxiliar (Defensor)</p>
                          <p className="text-sm text-gray-800">Nome: <strong>{alv.nome_auxiliar}</strong> | CPF: <strong>{alv.cpf_auxiliar}</strong></p>
                        </div>
                      )}

                      <div className="bg-white p-5 rounded-xl border border-gray-200 mb-4 space-y-4">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Documentos do Permissionário</p>
                          <div className="flex flex-wrap gap-2">
                            {alv.caminho_cnh && (
                              <a href={montarUrlArquivo(alv.caminho_cnh)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border transition-all">
                                <FileText className="w-3.5 h-3.5 text-primary-600" /> CNH
                              </a>
                            )}
                            {alv.caminho_crlv && (
                              <a href={montarUrlArquivo(alv.caminho_crlv)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border transition-all">
                                <FileText className="w-3.5 h-3.5 text-primary-600" /> CRLV
                              </a>
                            )}
                            {alv.caminho_titulo_eleitoral && (
                              <a href={montarUrlArquivo(alv.caminho_titulo_eleitoral)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border transition-all">
                                <FileText className="w-3.5 h-3.5 text-primary-600" /> Título Eleitoral
                              </a>
                            )}
                            {alv.caminho_certidao_eleitoral && (
                              <a href={montarUrlArquivo(alv.caminho_certidao_eleitoral)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border transition-all">
                                <FileText className="w-3.5 h-3.5 text-primary-600" /> Certidão Eleitoral
                              </a>
                            )}
                            {alv.caminho_antecedentes_criminais && (
                              <a href={montarUrlArquivo(alv.caminho_antecedentes_criminais)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border transition-all">
                                <FileText className="w-3.5 h-3.5 text-primary-600" /> Antecedentes Criminais
                              </a>
                            )}
                            {alv.caminho_comprovante_endereco && (
                              <a href={montarUrlArquivo(alv.caminho_comprovante_endereco)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border transition-all">
                                <FileText className="w-3.5 h-3.5 text-primary-600" /> Comprovante Endereço
                              </a>
                            )}
                            {alv.caminho_certificado_curso && (
                              <a href={montarUrlArquivo(alv.caminho_certificado_curso)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border transition-all">
                                <FileText className="w-3.5 h-3.5 text-primary-600" /> Certificado Curso
                              </a>
                            )}
                            {alv.caminho_cadastro_cnis && (
                              <a href={montarUrlArquivo(alv.caminho_cadastro_cnis)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border transition-all">
                                <FileText className="w-3.5 h-3.5 text-primary-600" /> Cadastro CNIS
                              </a>
                            )}
                            {alv.caminho_regularidade_cnis && (
                              <a href={montarUrlArquivo(alv.caminho_regularidade_cnis)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border transition-all">
                                <FileText className="w-3.5 h-3.5 text-primary-600" /> Regularidade CNIS
                              </a>
                            )}
                            {alv.caminho_foto && (
                              <a href={montarUrlArquivo(alv.caminho_foto)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border transition-all">
                                <FileText className="w-3.5 h-3.5 text-primary-600" /> Foto 3/4
                              </a>
                            )}
                            {alv.caminho_fator_rh && (
                              <a href={montarUrlArquivo(alv.caminho_fator_rh)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border transition-all">
                                <FileText className="w-3.5 h-3.5 text-primary-600" /> Comprovante Sangue/RH
                              </a>
                            )}
                          </div>
                        </div>

                        {alv.tem_auxiliar && (
                          <div>
                            <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Documentos do Auxiliar</p>
                            <div className="flex flex-wrap gap-2">
                              {alv.caminho_cnh_auxiliar && (
                                <a href={montarUrlArquivo(alv.caminho_cnh_auxiliar)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-150 rounded-lg border transition-all">
                                  <FileText className="w-3.5 h-3.5 text-blue-600" /> CNH Auxiliar
                                </a>
                              )}
                              {alv.caminho_crlv_auxiliar && (
                                <a href={montarUrlArquivo(alv.caminho_crlv_auxiliar)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-150 rounded-lg border transition-all">
                                  <FileText className="w-3.5 h-3.5 text-blue-600" /> CRLV Auxiliar
                                </a>
                              )}
                              {alv.caminho_titulo_eleitoral_auxiliar && (
                                <a href={montarUrlArquivo(alv.caminho_titulo_eleitoral_auxiliar)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-150 rounded-lg border transition-all">
                                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Título Eleitoral Auxiliar
                                </a>
                              )}
                              {alv.caminho_certidao_eleitoral_auxiliar && (
                                <a href={montarUrlArquivo(alv.caminho_certidao_eleitoral_auxiliar)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-150 rounded-lg border transition-all">
                                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Certidão Eleitoral Auxiliar
                                </a>
                              )}
                              {alv.caminho_antecedentes_criminais_auxiliar && (
                                <a href={montarUrlArquivo(alv.caminho_antecedentes_criminais_auxiliar)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-150 rounded-lg border transition-all">
                                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Antecedentes Auxiliar
                                </a>
                              )}
                              {alv.caminho_comprovante_endereco_auxiliar && (
                                <a href={montarUrlArquivo(alv.caminho_comprovante_endereco_auxiliar)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-150 rounded-lg border transition-all">
                                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Endereço Auxiliar
                                </a>
                              )}
                              {alv.caminho_certificado_curso_auxiliar && (
                                <a href={montarUrlArquivo(alv.caminho_certificado_curso_auxiliar)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-150 rounded-lg border transition-all">
                                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Certificado Curso Auxiliar
                                </a>
                              )}
                              {alv.caminho_cadastro_cnis_auxiliar && (
                                <a href={montarUrlArquivo(alv.caminho_cadastro_cnis_auxiliar)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-150 rounded-lg border transition-all">
                                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Cadastro CNIS Auxiliar
                                </a>
                              )}
                              {alv.caminho_regularidade_cnis_auxiliar && (
                                <a href={montarUrlArquivo(alv.caminho_regularidade_cnis_auxiliar)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-150 rounded-lg border transition-all">
                                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Regularidade CNIS Auxiliar
                                </a>
                              )}
                              {alv.caminho_foto_auxiliar && (
                                <a href={montarUrlArquivo(alv.caminho_foto_auxiliar)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-150 rounded-lg border transition-all">
                                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Foto Auxiliar
                                </a>
                              )}
                              {alv.caminho_fator_rh_auxiliar && (
                                <a href={montarUrlArquivo(alv.caminho_fator_rh_auxiliar)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-150 rounded-lg border transition-all">
                                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Fator RH Auxiliar
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {alv.status === 'Em Análise' ? (
                        <div className="border-t border-gray-200 pt-5 mt-4">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Parecer Técnico SMTT *</label>
                          <textarea 
                            rows="3" 
                            placeholder="Escreva o parecer técnico sobre a autorização de alvará/permissionário..."
                            value={alvaraFoco === alv.id ? justificativaAlvara : ''}
                            onChange={(e) => { setJustificativaAlvara(e.target.value); setAlvaraFoco(alv.id); }}
                            className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all mb-4 resize-none text-sm"
                          />

                          <div className="mb-5">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                              <Upload className="w-4 h-4 text-gray-500" /> Anexar Alvará Digital Emitido (Obrigatório para Aprovação)
                            </label>
                            <input 
                              type="file" 
                              accept=".pdf,image/*"
                              onChange={(e) => { setAlvaraArquivoEmitido(e.target.files[0]); setAlvaraFoco(alv.id); }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 border border-gray-200 rounded-xl p-2 bg-white transition-all cursor-pointer"
                            />
                          </div>

                          <div className="flex gap-3">
                            <button onClick={() => julgarAlvara(alv.id, 'Aprovado')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                              <CheckCircle className="w-5 h-5" /> Emitir / Aprovar Pedido
                            </button>
                            <button onClick={() => julgarAlvara(alv.id, 'Negado')} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                              <XCircle className="w-5 h-5" /> Negar Pedido
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-t border-gray-200 pt-4 mt-4 text-sm text-gray-600 bg-gray-100/50 p-4 rounded-xl space-y-2">
                          <div><strong>Parecer Técnico:</strong> <span className="italic">"{alv.resposta_analise}"</span></div>
                          {alv.caminho_alvara_emitido && (
                            <div className="pt-2">
                              <a href={montarUrlArquivo(alv.caminho_alvara_emitido)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 rounded-lg border border-green-200 transition-all">
                                <FileText className="w-3.5 h-3.5" /> Visualizar Alvará Emitido
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : menuAtivo === 'infracoes' ? (
          <>
            {/* Infrações View */}
            <header className="mb-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Infrações Lançadas</h1>
              <p className="text-gray-500">Visualize e filtre todas as autuações de trânsito registradas no município.</p>
            </header>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
              
              {/* Barra de Busca */}
              <div className="mb-6 max-w-md">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Buscar Autuação</label>
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Filtrar por Placa ou Número do AIT..."
                    value={filtroInfracao}
                    onChange={(e) => setFiltroInfracao(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>

              {infracoesFiltradas.length === 0 ? (
                <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                  <i className="fa-solid fa-file-invoice-dollar text-4xl mb-3 text-gray-300"></i>
                  <p className="font-bold text-base text-gray-600 mb-1">Nenhuma infração localizada</p>
                  <p className="text-xs text-gray-400 font-medium">Não há autos de infração que correspondam aos critérios de busca.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {infracoesFiltradas.map((inf) => {
                    const estaAberto = infracaoAberta === inf.id;
                    const gravidadeCores = {
                      'Leve': 'bg-green-50 text-green-700 border-green-200',
                      'Média': 'bg-yellow-50 text-yellow-800 border-yellow-200',
                      'Grave': 'bg-orange-50 text-orange-800 border-orange-200',
                      'Gravíssima': 'bg-red-50 text-red-700 border-red-200',
                    };
                    const corGravidade = gravidadeCores[inf.tipo_infracao?.gravidade || 'Média'] || 'bg-gray-50 text-gray-700 border-gray-200';

                    return (
                      <div key={inf.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-gray-50">
                        {/* Cabeçalho do Card */}
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="font-bold text-lg text-primary-900">
                                AIT: <span className="text-primary-600">{inf.numero_ait}</span>
                              </h3>
                              <span className="text-[10px] bg-blue-50 text-primary-600 border border-blue-100 font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wide">
                                Fase: {inf.fase_atual || 'Autuação'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <i className="fa-regular fa-calendar"></i>
                              <span className="ml-1">{inf.data_hora_infracao}</span>
                              <span className="mx-1.5">•</span>
                              <i className="fa-solid fa-location-dot"></i>
                              <span className="ml-1 truncate max-w-xs">{inf.local_cometimento}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400 font-bold block uppercase tracking-wide">Valor da Multa</span>
                            <span className="text-lg font-extrabold text-primary-900">
                              {inf.valor_final 
                                ? `R$ ${parseFloat(inf.valor_final).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : 'R$ 0,00'
                              }
                            </span>
                          </div>
                        </div>

                        {/* Corpo Principal (Veículo & Infração) */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-white p-5 rounded-xl border border-gray-200">
                          {/* Coluna Veículo */}
                          <div className="md:col-span-4 flex items-start gap-4 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0">
                            {/* Desenho da Placa Mercosul */}
                            <div className="inline-flex flex-col border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm font-sans w-24 shrink-0">
                              <div className="bg-blue-600 h-1.5 flex items-center justify-center">
                                <span className="text-[4px] text-white font-bold leading-none scale-75">BRASIL</span>
                              </div>
                              <div className="py-1 px-1.5 font-bold text-xs tracking-wider text-gray-900 text-center uppercase">
                                {inf.veiculo?.placa || 'SEM PLACA'}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-0.5">Veículo</p>
                              <p className="text-sm font-bold text-gray-800 leading-snug">
                                {inf.veiculo?.marca_modelo || 'Marca/Modelo não informado'}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Cor: <strong>{inf.veiculo?.cor || 'Não informada'}</strong>
                                {inf.veiculo?.ano_fabricacao && ` | Ano: ${inf.veiculo.ano_fabricacao}`}
                              </p>
                            </div>
                          </div>

                          {/* Coluna Infração */}
                          <div className="md:col-span-8 flex flex-col justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Enquadramento CTB</p>
                              <p className="text-sm font-bold text-gray-800 leading-snug">
                                <span className="bg-secondary-500 text-primary-950 px-2 py-0.5 rounded text-xs font-extrabold mr-2 uppercase tracking-wide">
                                  {inf.tipo_infracao?.codigo_infracao || 'Código'}
                                </span>
                                {inf.tipo_infracao?.descricao || 'Descrição da infração cometida'}
                              </p>
                              {inf.tipo_infracao?.amparo_legal && (
                                <p className="text-xs text-gray-500 italic mt-1.5">
                                  Amparo Legal: <strong>{inf.tipo_infracao.amparo_legal}</strong>
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-4 flex-wrap">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${corGravidade}`}>
                                Gravidade: {inf.tipo_infracao?.gravidade || 'Não informada'}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                <i className="fa-solid fa-circle-exclamation text-gray-400 text-[10px]"></i>
                                {inf.tipo_infracao?.pontos || 0} Pontos na CNH
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Botão Acordeão de Detalhes Legais */}
                        <div className="mt-4 pt-3 border-t border-gray-200/60 flex justify-end">
                          <button
                            onClick={() => setInfracaoAberta(estaAberto ? null : inf.id)}
                            className="text-xs text-primary-600 hover:text-primary-800 font-bold flex items-center gap-1.5 transition-colors focus:outline-none"
                          >
                            <span>{estaAberto ? 'Ocultar Detalhes Fiscais' : 'Ver Detalhes Fiscais e Legais'}</span>
                            <i className={`fa-solid fa-chevron-${estaAberto ? 'up' : 'down'} text-[10px]`}></i>
                          </button>
                        </div>

                        {/* Conteúdo Expansível do Acordeão */}
                        {estaAberto && (
                          <div className="mt-4 bg-white p-5 rounded-xl border border-gray-200/80 shadow-inner grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                            <div>
                              <p className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Agente / Aparelho Autuador</p>
                              <p className="font-semibold text-gray-700">{inf.agente_aparelho || 'Não informado'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Desdobramento</p>
                              <p className="font-semibold text-gray-700">{inf.desdobramento || '1'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Código Renainf</p>
                              <p className="font-semibold text-gray-700">{inf.codigo_renainf || 'Não informado'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Medição Aferida</p>
                              <p className="font-semibold text-gray-700">{inf.medicao_aferida || 'Não aferida'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Medição Considerada</p>
                              <p className="font-semibold text-gray-700">{inf.medicao_considerada || 'Não considerada'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Medição Regulamentada</p>
                              <p className="font-semibold text-gray-700">{inf.medicao_regulamentada || 'Não regulamentada'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Número da NAIT</p>
                              <p className="font-semibold text-gray-700">{inf.numero_nait || 'Não gerado'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Número da NIP</p>
                              <p className="font-semibold text-gray-700">{inf.numero_nip || 'Não gerado'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Data Expedição Notificação</p>
                              <p className="font-semibold text-gray-700">{inf.data_expedicao || 'Não expedida'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Vencimento da Defesa Prévia</p>
                              <p className="font-semibold text-gray-700 text-amber-700">{inf.data_vencimento_defesa || 'Não cadastrado'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Nosso Número (Boleto)</p>
                              <p className="font-semibold text-gray-700">{inf.nosso_numero || 'Não gerado'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Vencimento do Boleto</p>
                              <p className="font-semibold text-gray-700">{inf.data_vencimento_boleto || 'Não cadastrado'}</p>
                            </div>
                            {inf.linha_digitavel && (
                              <div className="sm:col-span-2 md:col-span-3 pt-2 border-t border-gray-100">
                                <p className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Linha Digitável</p>
                                <code className="bg-gray-50 px-2 py-1 rounded text-gray-600 block break-all font-mono">
                                  {inf.linha_digitavel}
                                </code>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : menuAtivo === 'noticias' ? (
          <>
            {/* Notícias View */}
            <header className="mb-10 flex flex-wrap justify-between items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Notícias</h1>
                <p className="text-gray-500">Publique, edite e organize as matérias e comunicados oficiais no portal público.</p>
              </div>
              {!exibindoFormNews && (
                <button
                  onClick={() => { setExibindoFormNews(true); setModoEdicaoNews(false); }}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-5 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm"
                >
                  <i className="fa-solid fa-plus text-xs"></i> Cadastrar Notícia
                </button>
              )}
            </header>

            {mensagem && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-200 flex items-start gap-3 font-medium"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />{mensagem}</div>}

            {exibindoFormNews ? (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8 max-w-3xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-secondary-500"></div>
                
                <h3 className="font-bold text-lg text-primary-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <i className="fa-solid fa-newspaper text-primary-600"></i>
                  {modoEdicaoNews ? 'Editar Notícia' : 'Publicar Nova Notícia'}
                </h3>

                <form onSubmit={salvarNoticia} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Título da Matéria *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Novos semáforos inteligentes são instalados no Centro"
                        value={tituloNews}
                        onChange={(e) => setTituloNews(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Categoria *</label>
                      <select
                        value={categoriaNews}
                        onChange={(e) => setCategoriaNews(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-semibold"
                      >
                        <option value="Geral">Geral</option>
                        <option value="Educação">Educação</option>
                        <option value="Mobilidade">Mobilidade</option>
                        <option value="Infraestrutura">Infraestrutura</option>
                        <option value="Comunicados">Comunicados</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Subtítulo ou Resumo (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Breve resumo que aparece na listagem dos cards..."
                      value={subtituloNews}
                      onChange={(e) => setSubtituloNews(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Conteúdo / Matéria Completa *</label>
                    <textarea
                      rows="8"
                      required
                      placeholder="Digite o texto da notícia. Pressione Enter para criar novos parágrafos..."
                      value={conteudoNews}
                      onChange={(e) => setConteudoNews(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Imagem de Capa (Opcional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImagemNews(e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 border border-gray-200 rounded-xl p-2 bg-white transition-all cursor-pointer"
                    />
                    {modoEdicaoNews && noticiaFoco?.imagem_url && (
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        * Já possui uma imagem cadastrada. Selecione um novo arquivo apenas se quiser substituí-la.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="submit"
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                    >
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      {modoEdicaoNews ? 'Atualizar Notícia' : 'Publicar Notícia'}
                    </button>
                    <button
                      type="button"
                      onClick={limparFormNoticia}
                      className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
                {noticias.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                    <i className="fa-solid fa-newspaper text-4xl mb-3 text-gray-300"></i>
                    <p className="font-bold text-base text-gray-600 mb-1">Nenhuma notícia publicada</p>
                    <p className="text-xs text-gray-400 font-medium">Clique no botão "Cadastrar Notícia" para fazer a primeira publicação.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {noticias.map((item) => (
                      <div key={item.id} className="border border-gray-200 hover:border-gray-250 rounded-xl p-4 bg-gray-50/40 hover:bg-gray-50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {/* Mini Imagem */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 shrink-0 relative border border-gray-150">
                            {item.imagem_url ? (
                              <img
                                src={montarUrlArquivo(item.imagem_url)}
                                alt={item.titulo}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <i className="fa-solid fa-newspaper text-gray-400"></i>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-base text-primary-950 leading-snug">{item.titulo}</h4>
                              <span className="text-[9px] bg-blue-50 text-primary-600 border border-blue-100 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                                {item.categoria}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold block mt-1">
                              <i className="fa-regular fa-calendar mr-1"></i> Publicado em: {item.criado_em}
                            </span>
                          </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => prepararEdicaoNoticia(item)}
                            className="bg-blue-50 hover:bg-blue-100 text-primary-600 border border-blue-100 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <i className="fa-solid fa-pen-to-square"></i> Editar
                          </button>
                          <button
                            onClick={() => deletarNoticia(item.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <i className="fa-solid fa-trash"></i> Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Estatísticas View */}
            <header className="mb-10 flex flex-wrap justify-between items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Estatísticas</h1>
                <p className="text-gray-500">Cadastre e gerencie as métricas de destaque exibidas na página inicial pública.</p>
              </div>
              {!exibindoFormEst && (
                <button
                  onClick={prepararCadastroEst}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-5 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm"
                >
                  <i className="fa-solid fa-plus text-xs"></i> Cadastrar Estatística
                </button>
              )}
            </header>

            {mensagem && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-200 flex items-start gap-3 font-medium"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />{mensagem}</div>}

            {exibindoFormEst ? (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8 max-w-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-secondary-500"></div>
                
                <h3 className="font-bold text-lg text-primary-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <i className="fa-solid fa-chart-line text-primary-600"></i>
                  {modoEdicaoEst ? 'Editar Estatística' : 'Cadastrar Nova Estatística'}
                </h3>

                <form onSubmit={salvarEstatistica} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Título / Rótulo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Veículos Fiscalizados"
                        value={tituloEst}
                        onChange={(e) => setTituloEst(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Valor de Destaque *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 150k+ ou -15%"
                        value={valorEst}
                        onChange={(e) => setValorEst(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Ícone do FontAwesome</label>
                      <input
                        type="text"
                        placeholder="Ex: fa-car, fa-laptop, fa-chart-line"
                        value={iconeEst}
                        onChange={(e) => setIconeEst(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">Use classes válidas do FontAwesome 6 (solid/regular).</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Ordem de Exibição</label>
                      <input
                        type="number"
                        placeholder="Ex: 1, 2, 3"
                        value={ordemEst}
                        onChange={(e) => setOrdemEst(parseInt(e.target.value) || 0)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setExibindoFormEst(false)}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow transition-all text-sm"
                    >
                      Salvar Estatística
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
                {estatisticas.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                    <i className="fa-solid fa-chart-line text-4xl mb-3 text-gray-300"></i>
                    <p className="font-bold text-base text-gray-600 mb-1">Nenhuma estatística cadastrada</p>
                    <p className="text-xs text-gray-400 font-medium">Clique no botão "Cadastrar Estatística" para criar a primeira métrica.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {estatisticas.map((item) => (
                      <div key={item.id} className="border border-gray-200 hover:border-gray-250 rounded-xl p-5 bg-gray-50/40 hover:bg-gray-50 transition-all flex flex-col justify-between h-44 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary-600/5 rounded-full group-hover:scale-110 transition-transform"></div>
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-2xl font-bold text-secondary-500">{item.valor}</span>
                            <span className="text-gray-400 text-lg">
                              <i className={`fa-solid ${item.icone || 'fa-chart-simple'}`}></i>
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-primary-950 leading-snug mb-1">{item.titulo}</h4>
                          <span className="text-[10px] text-gray-400 font-semibold block">Ordem: {item.ordem}</span>
                        </div>
                        
                        <div className="flex gap-2 justify-end border-t border-gray-100 pt-3 mt-3">
                          <button
                            onClick={() => prepararEdicaoEst(item)}
                            className="text-primary-600 hover:text-primary-800 text-xs font-bold transition-all flex items-center gap-1"
                            title="Editar"
                          >
                            <i className="fa-solid fa-pen-to-square"></i> Editar
                          </button>
                          <button
                            onClick={() => deletarEstatistica(item.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-bold transition-all flex items-center gap-1"
                            title="Excluir"
                          >
                            <i className="fa-solid fa-trash"></i> Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default AdminPainel;

// src/pages/AdminPainel.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  CheckCircle, XCircle, FileText, Paperclip, Upload,
  Layers, Calendar
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';

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

  // FILTERS AND PAGINATION STATES
  const [recursoBusca, setRecursoBusca] = useState('');
  const [recursoStatus, setRecursoStatus] = useState('Todos');
  const [recursoPage, setRecursoPage] = useState(1);
  const recursoPerPage = 5;

  const [eventoBusca, setEventoBusca] = useState('');
  const [eventoStatus, setEventoStatus] = useState('Todos');
  const [eventoPage, setEventoPage] = useState(1);
  const eventoPerPage = 5;

  const [alvaraBusca, setAlvaraBusca] = useState('');
  const [alvaraStatus, setAlvaraStatus] = useState('Todos');
  const [alvaraTipo, setAlvaraTipo] = useState('Todos');
  const [alvaraPage, setAlvaraPage] = useState(1);
  const alvaraPerPage = 5;

  const [infracaoGravidade, setInfracaoGravidade] = useState('Todos');
  const [infracaoFase, setInfracaoFase] = useState('Todos');
  const [infracaoPage, setInfracaoPage] = useState(1);
  const infracaoPerPage = 5;

  const [noticiaBusca, setNoticiaBusca] = useState('');
  const [noticiaFiltroCategoria, setNoticiaFiltroCategoria] = useState('Todos');
  const [noticiaPage, setNoticiaPage] = useState(1);
  const noticiaPerPage = 5;

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

  // ESTADOS DO VINCO DE NAIT E NIP
  const [modalNaitAberta, setModalNaitAberta] = useState(false);
  const [modalNipAberta, setModalNipAberta] = useState(false);
  const [infracaoFocoControle, setInfracaoFocoControle] = useState(null);
  
  // inputs para NAIT
  const [naitNumero, setNaitNumero] = useState('');
  const [naitDataExpedicao, setNaitDataExpedicao] = useState('');

  // inputs para NIP
  const [nipNumero, setNipNumero] = useState('');
  const [nipNossoNumero, setNipNossoNumero] = useState('');
  const [nipLinhaDigitavel, setNipLinhaDigitavel] = useState('');
  const [nipDataVencimentoBoleto, setNipDataVencimentoBoleto] = useState('');
  const [nipValorFinal, setNipValorFinal] = useState('');

  const handleMenuClick = (aba) => {
    setMenuAtivo(aba);
    localStorage.setItem('adminMenuAtivo', aba);
  };

  const tiposRecurso = ['Todos', 'Defesa Prévia', 'Recurso JARI', 'Indicação de Real Infrator'];

  const normalizeString = (str) => {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  };

  const normalizePlacaOuAit = (str) => {
    if (!str) return '';
    return str.toUpperCase().replace(/[- ]/g, '').trim();
  };

  const countRecursos = (tipo) => {
    if (tipo === 'Todos') {
      return recursos.length;
    }
    const normalizedTipo = normalizeString(tipo);
    return recursos.filter(
      (rec) => normalizeString(rec.tipo_recurso || 'Defesa Prévia') === normalizedTipo
    ).length;
  };

  const recursosFiltrados = recursos.filter((rec) => {
    if (filtroTipo !== 'Todos' && normalizeString(rec.tipo_recurso || 'Defesa Prévia') !== normalizeString(filtroTipo)) {
      return false;
    }
    if (recursoStatus !== 'Todos' && rec.resultado_julgamento !== recursoStatus) {
      return false;
    }
    if (recursoBusca.trim() !== '') {
      const query = normalizePlacaOuAit(recursoBusca);
      const protocolo = rec.protocolo?.numero_protocolo ? normalizePlacaOuAit(rec.protocolo.numero_protocolo) : '';
      const ait = rec.infracao?.numero_ait ? normalizePlacaOuAit(rec.infracao.numero_ait) : '';
      const placa = rec.infracao?.placa_veiculo ? normalizePlacaOuAit(rec.infracao.placa_veiculo) : '';
      if (!protocolo.includes(query) && !ait.includes(query) && !placa.includes(query)) {
        return false;
      }
    }
    return true;
  });

  const recursosPaginados = recursosFiltrados.slice(
    (recursoPage - 1) * recursoPerPage,
    recursoPage * recursoPerPage
  );

  const eventosFiltrados = eventos.filter((eve) => {
    if (eventoStatus !== 'Todos' && eve.status !== eventoStatus) {
      return false;
    }
    if (eventoBusca.trim() !== '') {
      const query = normalizeString(eventoBusca);
      const protocolo = normalizeString(eve.numero_protocolo || '');
      const solicitante = normalizeString(eve.nome_solicitante || '');
      const local = normalizeString(eve.local_evento || '');
      if (!protocolo.includes(query) && !solicitante.includes(query) && !local.includes(query)) {
        return false;
      }
    }
    return true;
  });

  const eventosPaginados = eventosFiltrados.slice(
    (eventoPage - 1) * eventoPerPage,
    eventoPage * eventoPerPage
  );

  const alvarasFiltrados = alvaras.filter((alv) => {
    if (alvaraStatus !== 'Todos' && alv.status !== alvaraStatus) {
      return false;
    }
    if (alvaraTipo !== 'Todos' && alv.tipo_servico !== alvaraTipo) {
      return false;
    }
    if (alvaraBusca.trim() !== '') {
      const query = normalizeString(alvaraBusca);
      const protocolo = normalizeString(alv.numero_protocolo || '');
      const solicitante = normalizeString(alv.nome_solicitante || '');
      
      const cpf = alv.cpf ? alv.cpf.replace(/\D/g, '') : '';
      const queryCpf = alvaraBusca.replace(/\D/g, '');
      const placa = alv.placa_veiculo ? normalizePlacaOuAit(alv.placa_veiculo) : '';
      const queryPlaca = normalizePlacaOuAit(alvaraBusca);

      const matchesProtocoloOrSolicitante = protocolo.includes(query) || solicitante.includes(query);
      const matchesCpf = queryCpf !== '' && cpf.includes(queryCpf);
      const matchesPlaca = queryPlaca !== '' && placa.includes(queryPlaca);

      if (!matchesProtocoloOrSolicitante && !matchesCpf && !matchesPlaca) {
        return false;
      }
    }
    return true;
  });

  const alvarasPaginados = alvarasFiltrados.slice(
    (alvaraPage - 1) * alvaraPerPage,
    alvaraPage * alvaraPerPage
  );

  const infracoesFiltradas = infracoes.filter((inf) => {
    if (filtroInfracao) {
      const busca = normalizePlacaOuAit(filtroInfracao);
      const placaInf = normalizePlacaOuAit(inf.veiculo?.placa);
      const aitInf = normalizePlacaOuAit(inf.numero_ait);
      if (!placaInf.includes(busca) && !aitInf.includes(busca)) {
        return false;
      }
    }
    if (infracaoGravidade !== 'Todos' && inf.tipo_infracao?.gravidade !== infracaoGravidade) {
      return false;
    }
    if (infracaoFase !== 'Todos' && (inf.fase_atual || 'Autuação') !== infracaoFase) {
      return false;
    }
    return true;
  });

  const infracoesPaginadas = infracoesFiltradas.slice(
    (infracaoPage - 1) * infracaoPerPage,
    infracaoPage * infracaoPerPage
  );

  const noticiasFiltradas = noticias.filter((item) => {
    if (noticiaFiltroCategoria !== 'Todos' && item.categoria !== noticiaFiltroCategoria) {
      return false;
    }
    if (noticiaBusca.trim() !== '') {
      const query = normalizeString(noticiaBusca);
      const titulo = normalizeString(item.titulo || '');
      const subtitulo = normalizeString(item.subtitulo || '');
      const conteudo = normalizeString(item.conteudo || '');
      if (!titulo.includes(query) && !subtitulo.includes(query) && !conteudo.includes(query)) {
        return false;
      }
    }
    return true;
  });

  const noticiasPaginadas = noticiasFiltradas.slice(
    (noticiaPage - 1) * noticiaPerPage,
    noticiaPage * noticiaPerPage
  );

  const renderPagination = (currentPage, totalItems, itemsPerPage, onPageChange) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-150">
        <div className="text-xs text-gray-500 font-semibold">
          Exibindo <span className="text-gray-800 font-bold">{startItem}</span> a <span className="text-gray-800 font-bold">{endItem}</span> de <span className="text-gray-800 font-bold">{totalItems}</span> registros
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:text-primary-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
          >
            <i className="fa-solid fa-chevron-left text-[10px]"></i> Anterior
          </button>
          
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-400 text-xs font-semibold">
                    ...
                  </span>
                );
              }
              const isActive = currentPage === page;
              return (
                <button
                  key={`page-${page}`}
                  onClick={() => onPageChange(page)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20 border border-primary-700'
                      : 'text-gray-600 hover:text-primary-700 bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:text-primary-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
          >
            Próximo <i className="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
        </div>
      </div>
    );
  };

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

  async function carregarRecursos() {
    try {
      const response = await api.get('/admin/recursos');
      setRecursos(response.data);
    } catch (error) {
      console.error("Erro ao carregar recursos", error);
    }
  };

  async function carregarEventos() {
    try {
      const response = await api.get('/admin/eventos');
      setEventos(response.data);
    } catch (error) {
      console.error("Erro ao carregar eventos", error);
    }
  };

  async function carregarAlvaras() {
    try {
      const response = await api.get('/admin/alvaras');
      setAlvaras(response.data);
    } catch (error) {
      console.error("Erro ao carregar alvarás", error);
    }
  };

  async function carregarInfracoes() {
    try {
      const response = await api.get('/admin/infracoes');
      setInfracoes(response.data);
    } catch (error) {
      console.error("Erro ao carregar infrações", error);
    }
  };

  async function carregarNoticias() {
    try {
      const response = await api.get('/admin/noticias');
      setNoticias(response.data);
    } catch (error) {
      console.error("Erro ao carregar notícias", error);
    }
  };

  async function carregarEstatisticas() {
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

  // Funções para Modais de NAIT/NIP
  const abrirModalNait = (inf) => {
    setInfracaoFocoControle(inf);
    setNaitNumero(inf.numero_nait || `700${Math.floor(1000000 + Math.random() * 9000000)}`);
    setNaitDataExpedicao(inf.data_expedicao ? inf.data_expedicao.split('/').reverse().join('-') : new Date().toISOString().split('T')[0]);
    setModalNaitAberta(true);
  };

  const abrirModalNip = (inf) => {
    setInfracaoFocoControle(inf);
    setNipNumero(inf.numero_nip || `700${Math.floor(1000000 + Math.random() * 9000000)}`);
    setNipNossoNumero(inf.nosso_numero || '');
    setNipLinhaDigitavel(inf.linha_digitavel || '');
    setNipDataVencimentoBoleto(inf.data_vencimento_boleto ? inf.data_vencimento_boleto.split('/').reverse().join('-') : '');
    setNipValorFinal(inf.valor_final || inf.tipo_infracao?.valor_base || '0.00');
    setModalNipAberta(true);
  };

  const handleGerarBoletoModal = () => {
    if (!infracaoFocoControle) return;
    const valorNum = parseFloat(nipValorFinal || 0);
    const nossoNum = nipNossoNumero || `84${Math.floor(10000000 + Math.random() * 90000000)}`;
    setNipNossoNumero(nossoNum);

    const valFormatado = valorNum.toFixed(2).replace('.', '');
    const valPad = valFormatado.padStart(10, '0');
    const linhaFicticia = `34191.79${Math.floor(100 + Math.random() * 900)} ${Math.floor(10000 + Math.random() * 90000)}.${Math.floor(100000 + Math.random() * 900000)} ${Math.floor(10000 + Math.random() * 90000)}.${Math.floor(100000 + Math.random() * 900000)} ${Math.floor(1 + Math.random() * 9)} ${valPad}`;
    setNipLinhaDigitavel(linhaFicticia);

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 45);
    setNipDataVencimentoBoleto(baseDate.toISOString().split('T')[0]);
  };

  const salvarControleNait = async () => {
    if (!naitNumero) {
      alert("O número da NAIT é obrigatório.");
      return;
    }
    try {
      await api.put(`/admin/infracoes/${infracaoFocoControle.id}`, {
        numero_nait: naitNumero,
        data_expedicao: naitDataExpedicao || null
      });
      alert("NAIT vinculada com sucesso!");
      setModalNaitAberta(false);
      carregarInfracoes();
    } catch (err) {
      alert(err.response?.data?.erro || "Erro ao salvar NAIT.");
    }
  };

  const salvarControleNip = async () => {
    if (!nipNumero) {
      alert("O número da NIP é obrigatório.");
      return;
    }
    try {
      await api.put(`/admin/infracoes/${infracaoFocoControle.id}`, {
        numero_nip: nipNumero,
        nosso_numero: nipNossoNumero || null,
        linha_digitavel: nipLinhaDigitavel || null,
        data_vencimento_boleto: nipDataVencimentoBoleto || null,
        valor_final: nipValorFinal ? parseFloat(nipValorFinal) : null,
        fase_atual: 'Penalidade'
      });
      alert("NIP vinculada com sucesso!");
      setModalNipAberta(false);
      carregarInfracoes();
    } catch (err) {
      alert(err.response?.data?.erro || "Erro ao salvar NIP.");
    }
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


  return (
    <div className="admin-shell flex h-screen bg-gray-50 font-sans text-gray-800 selection:bg-primary-600 selection:text-white">
      
      {/* Sidebar */}
      <AdminSidebar activeItem={menuAtivo} onTabChange={handleMenuClick} />

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
                  const total = countRecursos(tipo);
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
                      {total > 0 ? (
                        <span className={`flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full text-[10px] font-extrabold shadow-sm ${
                          ativo 
                            ? 'bg-primary-600 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {total}
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

              {/* FILTROS E BUSCA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Buscar Processo</label>
                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Buscar por Protocolo, número do AIT ou Placa..."
                      value={recursoBusca}
                      onChange={(e) => {
                        setRecursoBusca(e.target.value);
                        setRecursoPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Resultado / Status</label>
                  <select
                    value={recursoStatus}
                    onChange={(e) => {
                      setRecursoStatus(e.target.value);
                      setRecursoPage(1);
                    }}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-semibold text-gray-700"
                  >
                    <option value="Todos">Todos os Status</option>
                    <option value="Em Análise">Em Análise</option>
                    <option value="Deferido">Deferido</option>
                    <option value="Indeferido">Indeferido</option>
                  </select>
                </div>
              </div>

              {recursosFiltrados.length === 0 ? (
                <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                  <FileText className="w-12 h-12 mb-3 text-gray-300 stroke-[1.5]" />
                  <p className="font-bold text-base text-gray-600 mb-1">Nenhum processo localizado</p>
                  <p className="text-xs text-gray-400 font-medium">Não há requerimentos que correspondam aos filtros aplicados.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {recursosPaginados.map((rec) => (
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
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          rec.resultado_julgamento === 'Deferido'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : rec.resultado_julgamento === 'Indeferido'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
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
                            <button onClick={() => julgarRecurso(rec.id, 'Deferido')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer">
                              <CheckCircle className="w-5 h-5" /> Deferir (Aceitar Defesa)
                            </button>
                            <button onClick={() => julgarRecurso(rec.id, 'Indeferido')} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer">
                              <XCircle className="w-5 h-5" /> Indeferir (Manter Multa)
                            </button>
                          </div>
                        </div>
                      )}

                      {rec.resultado_julgamento !== 'Em Análise' && rec.resposta_analise && (
                        <div className="border-t border-gray-200 pt-4 mt-4 text-sm text-gray-600 bg-gray-100/50 p-4 rounded-xl space-y-2">
                          <div><strong>Parecer da JARI:</strong> <span className="italic">"{rec.resposta_analise}"</span></div>
                          {rec.caminho_oficio_resposta && (
                            <div className="pt-2">
                              <a href={montarUrlArquivo(rec.caminho_oficio_resposta)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 rounded-lg border border-green-200 transition-all">
                                <FileText className="w-3.5 h-3.5" /> Visualizar Ofício de Resposta
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
              {renderPagination(recursoPage, recursosFiltrados.length, recursoPerPage, setRecursoPage)}
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
              {/* FILTROS E BUSCA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Buscar Evento</label>
                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Buscar por Protocolo, Solicitante ou Local..."
                      value={eventoBusca}
                      onChange={(e) => {
                        setEventoBusca(e.target.value);
                        setEventoPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Status do Pedido</label>
                  <select
                    value={eventoStatus}
                    onChange={(e) => {
                      setEventoStatus(e.target.value);
                      setEventoPage(1);
                    }}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-semibold text-gray-700"
                  >
                    <option value="Todos">Todos os Status</option>
                    <option value="Em Análise">Em Análise</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Negado">Negado</option>
                  </select>
                </div>
              </div>

              {eventosFiltrados.length === 0 ? (
                <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                  <Calendar className="w-12 h-12 mb-3 text-gray-300 stroke-[1.5]" />
                  <p className="font-bold text-base text-gray-600 mb-1">Nenhum evento localizado</p>
                  <p className="text-xs text-gray-400 font-medium">Não há solicitações de interdição que correspondam aos filtros aplicados.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {eventosPaginados.map((eve) => (
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
                        <p className="text-sm text-gray-800">Local e Vias: <strong>{eve.local_evento || 'Não informado'}</strong></p>
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
                            <button onClick={() => julgarEvento(eve.id, 'Aprovado')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer">
                              <CheckCircle className="w-5 h-5" /> Autorizar / Aprovar Pedido
                            </button>
                            <button onClick={() => julgarEvento(eve.id, 'Negado')} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer">
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
              {renderPagination(eventoPage, eventosFiltrados.length, eventoPerPage, setEventoPage)}
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
              {/* FILTROS E BUSCA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Buscar Requerimento</label>
                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Buscar por Protocolo, Nome, CPF ou Placa..."
                      value={alvaraBusca}
                      onChange={(e) => {
                        setAlvaraBusca(e.target.value);
                        setAlvaraPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Tipo de Serviço</label>
                  <select
                    value={alvaraTipo}
                    onChange={(e) => {
                      setAlvaraTipo(e.target.value);
                      setAlvaraPage(1);
                    }}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-semibold text-gray-700"
                  >
                    <option value="Todos">Todos os Serviços</option>
                    <option value="Autorização de Permissionário">Autorização de Permissionário</option>
                    <option value="Renovação de Alvará">Renovação de Alvará</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Status do Pedido</label>
                  <select
                    value={alvaraStatus}
                    onChange={(e) => {
                      setAlvaraStatus(e.target.value);
                      setAlvaraPage(1);
                    }}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-semibold text-gray-700"
                  >
                    <option value="Todos">Todos os Status</option>
                    <option value="Em Análise">Em Análise</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Negado">Negado</option>
                  </select>
                </div>
              </div>

              {alvarasFiltrados.length === 0 ? (
                <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                  <FileText className="w-12 h-12 mb-3 text-gray-300 stroke-[1.5]" />
                  <p className="font-bold text-base text-gray-600 mb-1">Nenhum requerimento localizado</p>
                  <p className="text-xs text-gray-400 font-medium">Não há requerimentos de alvará/permissionário que correspondam aos filtros aplicados.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {alvarasPaginados.map((alv) => (
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
                            {alv.caminho_requerimento && (
                              <a href={montarUrlArquivo(alv.caminho_requerimento)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border transition-all">
                                <FileText className="w-3.5 h-3.5 text-primary-600" /> Requerimento
                              </a>
                            )}
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
              {renderPagination(alvaraPage, alvarasFiltrados.length, alvaraPerPage, setAlvaraPage)}
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
              
              {/* FILTROS E BUSCA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Buscar Autuação</label>
                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Placa ou número do AIT..."
                      value={filtroInfracao}
                      onChange={(e) => {
                        setFiltroInfracao(e.target.value);
                        setInfracaoPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Gravidade da Infração</label>
                  <select
                    value={infracaoGravidade}
                    onChange={(e) => {
                      setInfracaoGravidade(e.target.value);
                      setInfracaoPage(1);
                    }}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-semibold text-gray-700"
                  >
                    <option value="Todos">Todas as Gravidades</option>
                    <option value="Leve">Leve</option>
                    <option value="Média">Média</option>
                    <option value="Grave">Grave</option>
                    <option value="Gravíssima">Gravíssima</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Fase Atual</label>
                  <select
                    value={infracaoFase}
                    onChange={(e) => {
                      setInfracaoFase(e.target.value);
                      setInfracaoPage(1);
                    }}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-semibold text-gray-700"
                  >
                    <option value="Todos">Todas as Fases</option>
                    <option value="Autuação">Autuação</option>
                    <option value="Penalidade">Penalidade</option>
                    <option value="Recurso">Recurso</option>
                  </select>
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
                  {infracoesPaginadas.map((inf) => {
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

                            {/* Ações de Controle (NAIT/NIP) */}
                            <div className="sm:col-span-2 md:col-span-3 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                              {!inf.numero_nait ? (
                                <button
                                  onClick={() => abrirModalNait(inf)}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                                >
                                  <i className="fa-solid fa-file-signature"></i>
                                  Vincular NAIT
                                </button>
                              ) : (
                                <button
                                  onClick={() => abrirModalNait(inf)}
                                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                  <i className="fa-solid fa-pen-to-square"></i>
                                  Editar NAIT ({inf.numero_nait})
                                </button>
                              )}

                              {inf.numero_nait && !inf.numero_nip && (
                                <button
                                  onClick={() => abrirModalNip(inf)}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                                >
                                  <i className="fa-solid fa-file-invoice-dollar"></i>
                                  Vincular NIP (Penalidade)
                                </button>
                              )}

                              {inf.numero_nip && (
                                <button
                                  onClick={() => abrirModalNip(inf)}
                                  className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                  <i className="fa-solid fa-pen-to-square"></i>
                                  Editar NIP ({inf.numero_nip})
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {renderPagination(infracaoPage, infracoesFiltradas.length, infracaoPerPage, setInfracaoPage)}
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
                {/* FILTROS E BUSCA */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Buscar Matéria</label>
                    <div className="relative">
                      <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                      <input
                        type="text"
                        placeholder="Buscar por Título, Subtítulo ou Conteúdo..."
                        value={noticiaBusca}
                        onChange={(e) => {
                          setNoticiaBusca(e.target.value);
                          setNoticiaPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Categoria</label>
                    <select
                      value={noticiaFiltroCategoria}
                      onChange={(e) => {
                        setNoticiaFiltroCategoria(e.target.value);
                        setNoticiaPage(1);
                      }}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-semibold text-gray-700"
                    >
                      <option value="Todos">Todas as Categorias</option>
                      <option value="Geral">Geral</option>
                      <option value="Educação">Educação</option>
                      <option value="Mobilidade">Mobilidade</option>
                      <option value="Infraestrutura">Infraestrutura</option>
                      <option value="Comunicados">Comunicados</option>
                    </select>
                  </div>
                </div>

                {noticiasFiltradas.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                    <i className="fa-solid fa-newspaper text-4xl mb-3 text-gray-300"></i>
                    <p className="font-bold text-base text-gray-600 mb-1">Nenhuma notícia localizada</p>
                    <p className="text-xs text-gray-400 font-medium">Não há matérias que correspondam aos filtros aplicados.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {noticiasPaginadas.map((item) => (
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
                {renderPagination(noticiaPage, noticiasFiltradas.length, noticiaPerPage, setNoticiaPage)}
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
        {/* Modal Vincular NAIT */}
        {modalNaitAberta && infracaoFocoControle && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-150 w-full max-w-lg overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
              
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-file-signature"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-primary-950">Vincular / Editar NAIT</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">AIT: {infracaoFocoControle.numero_ait}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setModalNaitAberta(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-150 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Número da NAIT *</label>
                  <input
                    type="text"
                    value={naitNumero}
                    onChange={(e) => setNaitNumero(e.target.value)}
                    placeholder="Ex: 7003209824"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Data de Expedição da Notificação</label>
                  <input
                    type="date"
                    value={naitDataExpedicao}
                    onChange={(e) => setNaitDataExpedicao(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setModalNaitAberta(false)}
                  className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarControleNait}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Confirmar NAIT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Vincular NIP */}
        {modalNipAberta && infracaoFocoControle && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-150 w-full max-w-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-green-600"></div>
              
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-file-invoice-dollar"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-primary-950">Vincular / Editar NIP (Penalidade)</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">AIT: {infracaoFocoControle.numero_ait}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setModalNipAberta(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-150 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Número da NIP *</label>
                    <input
                      type="text"
                      value={nipNumero}
                      onChange={(e) => setNipNumero(e.target.value)}
                      placeholder="Ex: 7003190223"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Valor da Multa (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={nipValorFinal}
                      onChange={(e) => setNipValorFinal(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm font-bold text-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Nosso Número (Boleto)</label>
                    <input
                      type="text"
                      value={nipNossoNumero}
                      onChange={(e) => setNipNossoNumero(e.target.value)}
                      placeholder="Identificador do Boleto"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Vencimento do Boleto</label>
                    <input
                      type="date"
                      value={nipDataVencimentoBoleto}
                      onChange={(e) => setNipDataVencimentoBoleto(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Linha Digitável do Boleto</label>
                  <input
                    type="text"
                    value={nipLinhaDigitavel}
                    onChange={(e) => setNipLinhaDigitavel(e.target.value)}
                    placeholder="Ex: 34191.79001 01043.513184..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-xs font-mono"
                  />
                </div>

                {/* Cartão de Ações do Financeiro */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                      <i className="fa-solid fa-wallet"></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Faturamento da Autuação</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Gerar automaticamente o boleto bancário fictício para pagamento com base no valor.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGerarBoletoModal}
                    className="w-full sm:w-auto px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    Gerar Boleto
                  </button>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setModalNipAberta(false)}
                  className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarControleNip}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Confirmar NIP
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPainel;

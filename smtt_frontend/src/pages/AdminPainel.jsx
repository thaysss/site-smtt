import AdminCountBadge from '../components/AdminCountBadge';
// src/pages/AdminPainel.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  CheckCircle, XCircle, FileText, Paperclip, Upload,
  Calendar, Search, Clock3, SlidersHorizontal,
  Home, ChevronRight, Filter, MapPin, RefreshCw, Download,
  ArrowUpDown, ChevronDown, ChevronUp, ShieldAlert
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminRegistrosSection from '../components/AdminRegistrosSection';
import AdminRegistroActions from '../components/AdminRegistroActions';
import AdminDateFilter from '../components/AdminDateFilter';
import AdminAlvarasSection from '../components/AdminAlvarasSection';
import { matchesDateFilter } from '../utils/dateFilters';

const apiBaseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
const montarUrlArquivo = (caminho) => {
  if (!caminho) return '';
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return `${apiBaseUrl}${caminho}`;
};

function AdminPainel({ defaultTab }) {
  const [recursos, setRecursos] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [justificativaJari, setJustificativaJari] = useState('');
  const [recursoFoco, setRecursoFoco] = useState(null);
  const [recursoSalvando, setRecursoSalvando] = useState(false);
  
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

  const [infracaoGravidade, setInfracaoGravidade] = useState('Todos');
  const [infracaoFase, setInfracaoFase] = useState('Todos');
  const [infracaoPage, setInfracaoPage] = useState(1);
  const [infracaoOrdenacao, setInfracaoOrdenacao] = useState({ campo: 'data_hora_infracao', direcao: 'desc' });
  const infracaoPerPage = 5;

  const [noticiaBusca, setNoticiaBusca] = useState('');
  const [noticiaFiltroCategoria, setNoticiaFiltroCategoria] = useState('Todos');
  const [noticiaPage, setNoticiaPage] = useState(1);
  const noticiaPerPage = 5;

  const [periodMode, setPeriodMode] = useState('all');
  const [periodValue, setPeriodValue] = useState('');

  // NOVOS ESTADOS PARA EVENTOS, INFRAÇÕES E ALVARÁS
  const [menuAtivo, setMenuAtivo] = useState(() => defaultTab || localStorage.getItem('adminMenuAtivo') || 'recursos');
  const [eventos, setEventos] = useState([]);
  const [eventoFoco, setEventoFoco] = useState(null);
  const [justificativaEvento, setJustificativaEvento] = useState('');
  const [infracoes, setInfracoes] = useState([]);
  const [filtroInfracao, setFiltroInfracao] = useState('');
  const [infracaoAberta, setInfracaoAberta] = useState(null);
  const [alvaras, setAlvaras] = useState([]);

  // ESTADOS DO SISTEMA DE NOTÍCIAS
  const [noticias, setNoticias] = useState([]);
  const [noticiaFoco, setNoticiaFoco] = useState(null);
  const [tituloNews, setTituloNews] = useState('');
  const [subtituloNews, setSubtituloNews] = useState('');
  const [conteudoNews, setConteudoNews] = useState('');
  const [categoriaNews, setCategoriaNews] = useState('Geral');
  const [imagemNews, setImagemNews] = useState(null);
  const [imagemPreviewNews, setImagemPreviewNews] = useState('');
  const [previewNoticiaAberta, setPreviewNoticiaAberta] = useState(false);
  const [modoEdicaoNews, setModoEdicaoNews] = useState(false);
  const conteudoNewsRef = useRef(null);
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

  const resetPeriodPages = () => {
    setRecursoPage(1);
    setEventoPage(1);
    setInfracaoPage(1);
    setNoticiaPage(1);
  };

  const handlePeriodModeChange = (mode) => {
    setPeriodMode(mode);
    setPeriodValue('');
    resetPeriodPages();
  };

  const handlePeriodValueChange = (value) => {
    setPeriodValue(value);
    resetPeriodPages();
  };

  const clearPeriodFilter = () => {
    setPeriodMode('all');
    setPeriodValue('');
    resetPeriodPages();
  };

  const dateFilterControl = (
    <AdminDateFilter
      mode={periodMode}
      value={periodValue}
      onModeChange={handlePeriodModeChange}
      onValueChange={handlePeriodValueChange}
      onClear={clearPeriodFilter}
    />
  );

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
    const recursosNoPeriodo = recursos.filter((rec) => matchesDateFilter(rec.criado_em, periodMode, periodValue));
    if (tipo === 'Todos') {
      return recursosNoPeriodo.length;
    }
    const normalizedTipo = normalizeString(tipo);
    return recursosNoPeriodo.filter(
      (rec) => normalizeString(rec.tipo_recurso || 'Defesa Prévia') === normalizedTipo
    ).length;
  };

  const recursosFiltrados = recursos.filter((rec) => {
    if (!matchesDateFilter(rec.criado_em, periodMode, periodValue)) return false;
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

  const recursosNoPeriodo = recursos.filter((rec) => matchesDateFilter(rec.criado_em, periodMode, periodValue));
  const recursoStats = {
    total: recursosNoPeriodo.length,
    analise: recursosNoPeriodo.filter((rec) => rec.resultado_julgamento === 'Em Análise').length,
    deferidos: recursosNoPeriodo.filter((rec) => rec.resultado_julgamento === 'Deferido').length,
    indeferidos: recursosNoPeriodo.filter((rec) => rec.resultado_julgamento === 'Indeferido').length,
  };

  const limparFiltrosRecursos = () => {
    setFiltroTipo('Todos');
    setRecursoBusca('');
    setRecursoStatus('Todos');
    clearPeriodFilter();
    setRecursoPage(1);
  };

  const eventosFiltrados = eventos.filter((eve) => {
    if (!matchesDateFilter(eve.criado_em, periodMode, periodValue)) return false;
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

  const totalEventos = eventos.length;
  const eventosAguardando = eventos.filter((eve) => ['Pendente', 'Recebido', 'Aguardando Análise'].includes(eve.status)).length;
  const eventosEmAnalise = eventos.filter((eve) => eve.status === 'Em Análise').length;

  const infracaoCancelada = (inf) => {
    const fase = normalizeString(inf.fase_atual || '');
    return fase.includes('deferida') || fase.includes('cancelada') || fase.includes('anulada');
  };

  const parseInfracaoDate = (value) => {
    const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
    if (!match) return 0;
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4] || 0), Number(match[5] || 0)).getTime();
  };

  const infracoesFiltradas = infracoes
    .filter((inf) => {
      if (!matchesDateFilter(inf.data_hora_infracao, periodMode, periodValue)) return false;
      if (filtroInfracao) {
        const busca = normalizePlacaOuAit(filtroInfracao);
        const placaInf = normalizePlacaOuAit(inf.veiculo?.placa);
        const aitInf = normalizePlacaOuAit(inf.numero_ait);
        const modeloInf = normalizePlacaOuAit(inf.veiculo?.marca_modelo);
        if (!placaInf.includes(busca) && !aitInf.includes(busca) && !modeloInf.includes(busca)) return false;
      }
      if (infracaoGravidade !== 'Todos' && inf.tipo_infracao?.gravidade !== infracaoGravidade) return false;
      if (infracaoFase === 'Ativas' && infracaoCancelada(inf)) return false;
      if (infracaoFase === 'Canceladas' && !infracaoCancelada(inf)) return false;
      return true;
    })
    .sort((first, second) => {
      let firstValue;
      let secondValue;
      if (infracaoOrdenacao.campo === 'data_hora_infracao') {
        firstValue = parseInfracaoDate(first.data_hora_infracao);
        secondValue = parseInfracaoDate(second.data_hora_infracao);
      } else if (infracaoOrdenacao.campo === 'gravidade') {
        const peso = { 'Leve': 1, 'Média': 2, 'Grave': 3, 'Gravíssima': 4 };
        firstValue = peso[first.tipo_infracao?.gravidade] || 0;
        secondValue = peso[second.tipo_infracao?.gravidade] || 0;
      } else {
        firstValue = Number(first.valor_final || 0);
        secondValue = Number(second.valor_final || 0);
      }
      return infracaoOrdenacao.direcao === 'asc' ? firstValue - secondValue : secondValue - firstValue;
    });

  const infracoesPaginadas = infracoesFiltradas.slice(
    (infracaoPage - 1) * infracaoPerPage,
    infracaoPage * infracaoPerPage
  );

  const infracaoStats = {
    total: infracoes.length,
    ativas: infracoes.filter((item) => !infracaoCancelada(item)).length,
    canceladas: infracoes.filter(infracaoCancelada).length,
    pontos: infracoes.reduce((total, item) => total + (infracaoCancelada(item) ? 0 : Number(item.tipo_infracao?.pontos || 0)), 0),
  };

  const ordenarInfracoes = (campo) => {
    setInfracaoOrdenacao((atual) => ({
      campo,
      direcao: atual.campo === campo && atual.direcao === 'desc' ? 'asc' : 'desc',
    }));
    setInfracaoPage(1);
  };

  const exportarInfracoes = () => {
    const cabecalho = ['AIT', 'Placa', 'Data', 'Local', 'Fase', 'Gravidade', 'Pontos', 'Valor'];
    const linhas = infracoesFiltradas.map((item) => [
      item.numero_ait,
      item.veiculo?.placa || '',
      item.data_hora_infracao || '',
      item.local_cometimento || '',
      item.fase_atual || 'Autuação',
      item.tipo_infracao?.gravidade || '',
      item.tipo_infracao?.pontos || 0,
      Number(item.valor_final || 0).toFixed(2),
    ]);
    const escapar = (valor) => '"' + String(valor ?? '').replace(/"/g, '""') + '"';
    const csv = [cabecalho, ...linhas].map((linha) => linha.map(escapar).join(';')).join('\n');
    const arquivo = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'infracoes-smtt.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const noticiasFiltradas = noticias.filter((item) => {
    if (!matchesDateFilter(item.criado_em, periodMode, periodValue)) return false;
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
  }, [navigate, menuAtivo]);

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

  const abrirRecurso = (recurso) => {
    const finalizado = recurso.resultado_julgamento !== 'Em Análise';
    setRecursoFoco(recurso.id);
    setJustificativaJari(finalizado ? (recurso.justificativa_julgamento || '') : '');
    setArquivoResposta(null);
  };

  const fecharRecurso = () => {
    if (recursoSalvando) return;
    setRecursoFoco(null);
    setJustificativaJari('');
    setArquivoResposta(null);
  };

  const julgarRecurso = async (id, decisao) => {
    if (!justificativaJari.trim()) {
      alert("Digite o parecer técnico antes de julgar.");
      return;
    }
    
    setRecursoSalvando(true);
    try {
      const formData = new FormData();
      formData.append('decisao', decisao);
      formData.append('justificativa_jari', justificativaJari.trim());
      if (arquivoResposta) {
        formData.append('arquivo_resposta', arquivoResposta);
      }

      await api.put(`/admin/recursos/${id}/julgar`, formData);
      setMensagem(`Recurso ${decisao.toLowerCase()} com sucesso. O parecer já está disponível ao cidadão.`);
      setJustificativaJari('');
      setArquivoResposta(null);
      setRecursoFoco(null);
      await carregarRecursos();
    } catch (error) {
      console.error('Erro ao julgar recurso', error);
      alert(error.response?.data?.erro || "Erro ao julgar recurso.");
    } finally {
      setRecursoSalvando(false);
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

  const liberarPreviewImagemNews = () => {
    if (imagemPreviewNews.startsWith('blob:')) {
      URL.revokeObjectURL(imagemPreviewNews);
    }
  };

  const limparFormNoticia = () => {
    liberarPreviewImagemNews();
    setNoticiaFoco(null);
    setTituloNews('');
    setSubtituloNews('');
    setConteudoNews('');
    setCategoriaNews('Geral');
    setImagemNews(null);
    setImagemPreviewNews('');
    setPreviewNoticiaAberta(false);
    setModoEdicaoNews(false);
    setExibindoFormNews(false);
  };

  const prepararNovaNoticia = () => {
    liberarPreviewImagemNews();
    let rascunho = null;
    try {
      rascunho = JSON.parse(localStorage.getItem('smtt-noticia-rascunho') || 'null');
    } catch {
      localStorage.removeItem('smtt-noticia-rascunho');
    }

    setNoticiaFoco(null);
    setTituloNews(rascunho?.titulo || '');
    setSubtituloNews(rascunho?.subtitulo || '');
    setConteudoNews(rascunho?.conteudo || '');
    setCategoriaNews(rascunho?.categoria || 'Geral');
    setImagemNews(null);
    setImagemPreviewNews('');
    setModoEdicaoNews(false);
    setExibindoFormNews(true);
    if (rascunho) setMensagem('Rascunho local recuperado.');
  };

  const prepararEdicaoNoticia = (n) => {
    liberarPreviewImagemNews();
    setNoticiaFoco(n);
    setTituloNews(n.titulo);
    setSubtituloNews(n.subtitulo || '');
    setConteudoNews(n.conteudo);
    setCategoriaNews(n.categoria || 'Geral');
    setImagemNews(null);
    setImagemPreviewNews(n.imagem_url ? montarUrlArquivo(n.imagem_url) : '');
    setModoEdicaoNews(true);
    setExibindoFormNews(true);
  };

  const selecionarImagemNews = (e) => {
    const arquivo = e.target.files?.[0] || null;
    if (arquivo && !['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.type)) {
      alert('Selecione uma imagem PNG, JPG ou WebP.');
      e.target.value = '';
      return;
    }
    if (arquivo && arquivo.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5 MB.');
      e.target.value = '';
      return;
    }
    liberarPreviewImagemNews();
    setImagemNews(arquivo);
    setImagemPreviewNews(arquivo ? URL.createObjectURL(arquivo) : '');
  };

  const salvarRascunhoNoticia = () => {
    localStorage.setItem('smtt-noticia-rascunho', JSON.stringify({
      titulo: tituloNews,
      subtitulo: subtituloNews,
      conteudo: conteudoNews,
      categoria: categoriaNews
    }));
    setMensagem('Rascunho salvo neste dispositivo. A imagem deverá ser selecionada novamente.');
  };

  const aplicarFormatoNoticia = (inicio, fim = inicio, textoPadrao = '') => {
    const editor = conteudoNewsRef.current;
    if (!editor) return;
    const selecaoInicio = editor.selectionStart;
    const selecaoFim = editor.selectionEnd;
    const selecionado = conteudoNews.slice(selecaoInicio, selecaoFim) || textoPadrao;
    const novoConteudo = `${conteudoNews.slice(0, selecaoInicio)}${inicio}${selecionado}${fim}${conteudoNews.slice(selecaoFim)}`;
    setConteudoNews(novoConteudo);
    requestAnimationFrame(() => {
      editor.focus();
      const cursor = selecaoInicio + inicio.length + selecionado.length + fim.length;
      editor.setSelectionRange(cursor, cursor);
    });
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

      localStorage.removeItem('smtt-noticia-rascunho');
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
      <main className="admin-panel-main flex-1 overflow-y-auto p-6 md:p-10">
        {menuAtivo === 'registros' ? (<AdminRegistrosSection />) : menuAtivo === 'recursos' ? (
          <div className="recursos-admin">
            <nav className="recursos-breadcrumb" aria-label="Navegação estrutural">
              <Home size={14} /><ChevronRight size={13} /><strong>Julgamento de Recursos</strong>
            </nav>

            <header className="recursos-page-header">
              <div>
                <h1>Julgamento de Recursos</h1>
                <p>Analise os documentos e registre decisões fundamentadas para os recursos de multas.</p>
              </div>
            </header>

            {mensagem && (
              <div className="recursos-feedback" role="status">
                <CheckCircle size={20} />
                <span>{mensagem}</span>
                <button type="button" aria-label="Fechar mensagem" onClick={() => setMensagem('')}><XCircle size={18} /></button>
              </div>
            )}

            <section className="admin-count-grid" aria-label="Resumo dos recursos">
              <AdminCountBadge icon={FileText} label="Total no período" value={recursoStats.total} tone="blue" />
              <AdminCountBadge icon={Clock3} label="Aguardando análise" value={recursoStats.analise} tone="amber" />
              <AdminCountBadge icon={CheckCircle} label="Deferidos" value={recursoStats.deferidos} tone="green" />
              <AdminCountBadge icon={XCircle} label="Indeferidos" value={recursoStats.indeferidos} tone="red" />
            </section>

            <section className="recursos-filter-card" aria-label="Filtros de recursos">
              <div className="recursos-type-tabs" role="tablist" aria-label="Tipos de recurso">
                {tiposRecurso.map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    role="tab"
                    aria-selected={filtroTipo === tipo}
                    className={filtroTipo === tipo ? 'is-active' : ''}
                    onClick={() => { setFiltroTipo(tipo); setRecursoPage(1); }}
                  >
                    {tipo}<span>{countRecursos(tipo)}</span>
                  </button>
                ))}
              </div>

              <div className="recursos-filter-grid">
                <label className="recursos-field is-search">
                  <span>Buscar processo</span>
                  <div><Search size={17} /><input type="text" placeholder="Protocolo, número do AIT ou placa" value={recursoBusca} onChange={(e) => { setRecursoBusca(e.target.value); setRecursoPage(1); }} /></div>
                </label>
                <label className="recursos-field">
                  <span>Status</span>
                  <select value={recursoStatus} onChange={(e) => { setRecursoStatus(e.target.value); setRecursoPage(1); }}>
                    <option value="Todos">Todos os status</option>
                    <option value="Em Análise">Aguardando análise</option>
                    <option value="Deferido">Deferido</option>
                    <option value="Indeferido">Indeferido</option>
                  </select>
                </label>
                <label className="recursos-field">
                  <span>Período</span>
                  <select value={periodMode} onChange={(e) => handlePeriodModeChange(e.target.value)}>
                    <option value="all">Todos os períodos</option>
                    <option value="day">Dia específico</option>
                    <option value="month">Mês</option>
                    <option value="year">Ano</option>
                  </select>
                </label>
                {periodMode !== 'all' && (
                  <label className="recursos-field is-period-value">
                    <span>{periodMode === 'day' ? 'Data' : periodMode === 'month' ? 'Mês' : 'Ano'}</span>
                    <input type={periodMode === 'day' ? 'date' : periodMode === 'month' ? 'month' : 'number'} min={periodMode === 'year' ? '2000' : undefined} max={periodMode === 'year' ? '2100' : undefined} value={periodValue} onChange={(e) => handlePeriodValueChange(e.target.value)} />
                  </label>
                )}
                <button type="button" className="recursos-clear-button" onClick={limparFiltrosRecursos}><SlidersHorizontal size={17} /> Limpar filtros</button>
              </div>
            </section>

            <section className="recursos-results-card">
              <header>
                <div><h2>Recursos</h2><span>{recursosFiltrados.length} {recursosFiltrados.length === 1 ? 'resultado' : 'resultados'}</span></div>
                <small>Selecione um processo para consultar os documentos e registrar o parecer.</small>
              </header>

              {recursosFiltrados.length === 0 ? (
                <div className="recursos-empty-state">
                  <span><FileText size={42} /><Search size={18} /></span>
                  <h3>Nenhum processo localizado</h3>
                  <p>Não há recursos que correspondam aos filtros selecionados.</p>
                  <button type="button" onClick={limparFiltrosRecursos}><SlidersHorizontal size={17} /> Limpar filtros</button>
                </div>
              ) : (
                <>
                  <div className="recursos-table-scroll">
                    <table className="recursos-table">
                      <thead>
                        <tr>
                          <th>Protocolo</th>
                          <th>Tipo</th>
                          <th>AIT / Placa</th>
                          <th>Documentos</th>
                          <th>Recebido em</th>
                          <th>Status</th>
                          <th>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recursosPaginados.map((rec) => {
                          const finalizado = rec.resultado_julgamento !== 'Em Análise';
                          const documentos = (rec.arquivo_recurso_cidadao ? 1 : 0) + (rec.anexos?.length || 0);
                          const tipoClass = normalizeString(rec.tipo_recurso || '').includes('jari') ? 'is-jari' : normalizeString(rec.tipo_recurso || '').includes('infrator') ? 'is-driver' : 'is-defense';
                          return (
                            <tr key={rec.id}>
                              <td className="recursos-protocol">{rec.protocolo?.numero_protocolo || `REC-${rec.id}`}</td>
                              <td><span className={`recursos-type ${tipoClass}`}>{rec.tipo_recurso || 'Defesa Prévia'}</span></td>
                              <td><strong>{rec.infracao?.numero_ait || 'N/A'}</strong><small>{rec.infracao?.placa_veiculo || 'N/A'}</small></td>
                              <td><span className="recursos-doc-count"><Paperclip size={15} /> {documentos} {documentos === 1 ? 'arquivo' : 'arquivos'}</span></td>
                              <td>{rec.criado_em?.split(' ')[0] || 'Não informado'}</td>
                              <td><span className={`recursos-status ${rec.resultado_julgamento === 'Deferido' ? 'is-approved' : rec.resultado_julgamento === 'Indeferido' ? 'is-denied' : 'is-review'}`}>{rec.resultado_julgamento === 'Em Análise' ? 'Aguardando análise' : rec.resultado_julgamento}</span></td>
                              <td><button type="button" className="recursos-table-action" onClick={() => abrirRecurso(rec)}>{finalizado ? 'Visualizar' : 'Analisar'}</button><AdminRegistroActions category="recursos" id={rec.id} onSaved={carregarRecursos} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="recursos-table-footer">
                    <span>Mostrando {(recursoPage - 1) * recursoPerPage + 1}–{Math.min(recursoPage * recursoPerPage, recursosFiltrados.length)} de {recursosFiltrados.length} recursos</span>
                    {renderPagination(recursoPage, recursosFiltrados.length, recursoPerPage, setRecursoPage)}
                  </div>
                </>
              )}
            </section>

            {recursoFoco && (() => {
              const recursoSelecionado = recursos.find((item) => item.id === recursoFoco);
              if (!recursoSelecionado) return null;
              const finalizado = recursoSelecionado.resultado_julgamento !== 'Em Análise';
              const documentos = (recursoSelecionado.arquivo_recurso_cidadao ? 1 : 0) + (recursoSelecionado.anexos?.length || 0);
              return (
                <div className="recurso-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) fecharRecurso(); }}>
                  <section className="recurso-modal" role="dialog" aria-modal="true" aria-labelledby="recurso-modal-title">
                    <header className="recurso-modal-header">
                      <div>
                        <span>Processo administrativo</span>
                        <h2 id="recurso-modal-title">{recursoSelecionado.protocolo?.numero_protocolo || `Recurso ${recursoSelecionado.id}`}</h2>
                      </div>
                      <div className="recurso-modal-header-actions">
                        <span className={`recursos-status ${recursoSelecionado.resultado_julgamento === 'Deferido' ? 'is-approved' : recursoSelecionado.resultado_julgamento === 'Indeferido' ? 'is-denied' : 'is-review'}`}>{recursoSelecionado.resultado_julgamento === 'Em Análise' ? 'Aguardando análise' : recursoSelecionado.resultado_julgamento}</span>
                        <button type="button" onClick={fecharRecurso} aria-label="Fechar detalhes"><XCircle size={22} /></button>
                      </div>
                    </header>

                    <div className="recurso-modal-body">
                      <section className="recurso-overview">
                        <div><span>Tipo de recurso</span><strong>{recursoSelecionado.tipo_recurso || 'Defesa Prévia'}</strong></div>
                        <div><span>Número do AIT</span><strong>{recursoSelecionado.infracao?.numero_ait || 'N/A'}</strong></div>
                        <div><span>Placa do veículo</span><strong>{recursoSelecionado.infracao?.placa_veiculo || 'N/A'}</strong></div>
                        <div><span>Recebido em</span><strong>{recursoSelecionado.criado_em || 'Não informado'}</strong></div>
                      </section>

                      <section className="recurso-modal-section">
                        <div className="recurso-section-heading">
                          <div><Paperclip size={18} /><h3>Documentos do processo</h3></div>
                          <span>{documentos} {documentos === 1 ? 'arquivo' : 'arquivos'}</span>
                        </div>
                        <div className="recurso-documents-grid">
                          {recursoSelecionado.arquivo_recurso_cidadao ? (
                            <a className="recurso-document is-primary" href={montarUrlArquivo(recursoSelecionado.arquivo_recurso_cidadao)} target="_blank" rel="noopener noreferrer">
                              <span><FileText size={19} /></span><div><strong>Formulário principal do recurso</strong><small>Documento enviado pelo cidadão</small></div><i className="fa-solid fa-arrow-up-right-from-square" />
                            </a>
                          ) : (
                            <div className="recurso-document is-missing"><span><XCircle size={19} /></span><div><strong>Formulário principal indisponível</strong><small>Nenhum arquivo foi anexado</small></div></div>
                          )}
                          {recursoSelecionado.anexos?.map((anexo, idx) => (
                            <a key={`${anexo.caminho_arquivo}-${idx}`} className="recurso-document" href={montarUrlArquivo(anexo.caminho_arquivo)} target="_blank" rel="noopener noreferrer">
                              <span><Paperclip size={18} /></span><div><strong>{anexo.nome_original || `Documento adicional ${idx + 1}`}</strong><small>Anexo complementar</small></div><i className="fa-solid fa-arrow-up-right-from-square" />
                            </a>
                          ))}
                        </div>
                      </section>

                      {finalizado ? (
                        <section className="recurso-decision-readonly">
                          <div className="recurso-section-heading"><div><CheckCircle size={18} /><h3>Decisão registrada</h3></div><span>{recursoSelecionado.data_julgamento || 'Data não informada'}</span></div>
                          <blockquote>{recursoSelecionado.justificativa_julgamento || 'Nenhum parecer técnico foi registrado.'}</blockquote>
                          {recursoSelecionado.anexo_resposta_jari && (
                            <a href={montarUrlArquivo(recursoSelecionado.anexo_resposta_jari)} target="_blank" rel="noopener noreferrer"><FileText size={17} /> Visualizar ofício de resposta <i className="fa-solid fa-arrow-up-right-from-square" /></a>
                          )}
                        </section>
                      ) : (
                        <section className="recurso-decision-form">
                          <div className="recurso-section-heading"><div><ShieldAlert size={18} /><h3>Parecer e decisão</h3></div><span>Obrigatório</span></div>
                          <label htmlFor="recurso-parecer">Parecer técnico fundamentado</label>
                          <textarea id="recurso-parecer" rows="6" placeholder="Descreva a análise dos documentos, a fundamentação legal e a conclusão..." value={justificativaJari} onChange={(e) => setJustificativaJari(e.target.value)} />
                          <div className="recurso-parecer-meta"><span>{justificativaJari.length} caracteres</span><small>O cidadão terá acesso integral a este parecer após a decisão.</small></div>

                          <label htmlFor="recurso-oficio"><Upload size={16} /> Ofício de resposta <small>(opcional)</small></label>
                          <div className="recurso-upload-row">
                            <input id="recurso-oficio" type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => setArquivoResposta(e.target.files?.[0] || null)} />
                            {arquivoResposta && <span><CheckCircle size={15} /> {arquivoResposta.name}</span>}
                          </div>

                          <div className="recurso-decision-note"><ShieldAlert size={17} /><p><strong>Confira o parecer antes de concluir.</strong> A decisão altera a situação da infração e ficará disponível na consulta pública.</p></div>
                          <div className="recurso-decision-actions">
                            <button type="button" className="is-approved" disabled={recursoSalvando || !justificativaJari.trim()} onClick={() => julgarRecurso(recursoSelecionado.id, 'Deferido')}><CheckCircle size={19} /> {recursoSalvando ? 'Registrando...' : 'Deferir recurso'}</button>
                            <button type="button" className="is-denied" disabled={recursoSalvando || !justificativaJari.trim()} onClick={() => julgarRecurso(recursoSelecionado.id, 'Indeferido')}><XCircle size={19} /> {recursoSalvando ? 'Registrando...' : 'Indeferir recurso'}</button>
                          </div>
                        </section>
                      )}
                    </div>
                  </section>
                </div>
              );
            })()}
          </div>
        ) : menuAtivo === 'eventos' ? (
          <div className="eventos-consulta eventos-consulta--table">
            <nav className="eventos-breadcrumb" aria-label="Navegação estrutural">
              <Home size={14} /><ChevronRight size={13} /><strong>Solicitações de Eventos</strong>
            </nav>

            <header className="eventos-page-header">
              <div>
                <h1>Solicitações de Eventos</h1>
                <p>Analise e acompanhe os pedidos de interdição de vias para eventos.</p>
              </div>
            </header>

            <section className="admin-count-grid" aria-label="Resumo das solicitações">
              <AdminCountBadge icon={FileText} label="Total de solicitações" value={totalEventos} tone="blue" />
              <AdminCountBadge icon={Clock3} label="Aguardando análise" value={eventosAguardando + eventosEmAnalise} tone="amber" />
              <AdminCountBadge icon={CheckCircle} label="Aprovadas" value={eventos.filter((eve) => eve.status === 'Aprovado').length} tone="green" />
              <AdminCountBadge icon={XCircle} label="Negadas" value={eventos.filter((eve) => eve.status === 'Negado').length} tone="red" />
            </section>

            {mensagem && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-200 flex items-start gap-3 font-medium"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />{mensagem}</div>}

            <section className="eventos-filter-card" aria-label="Filtros de eventos">
              <div className="eventos-filter-grid">
                <div className="eventos-field eventos-field--search">
                  <label htmlFor="evento-busca">Buscar solicitação</label>
                  <div className="eventos-control-wrap">
                    <Search size={18} aria-hidden="true" />
                    <input id="evento-busca" type="text" placeholder="Protocolo, responsável ou local" value={eventoBusca} onChange={(event) => { setEventoBusca(event.target.value); setEventoPage(1); }} />
                  </div>
                </div>
                <div className="eventos-field">
                  <label htmlFor="evento-status">Status</label>
                  <select id="evento-status" value={eventoStatus} onChange={(event) => { setEventoStatus(event.target.value); setEventoPage(1); }}>
                    <option value="Todos">Todos</option>
                    <option value="Em Análise">Aguardando análise</option>
                    <option value="Aprovado">Aprovada</option>
                    <option value="Negado">Negada</option>
                  </select>
                </div>
                <div className="eventos-field">
                  <label htmlFor="evento-periodo">Período</label>
                  <select id="evento-periodo" value={periodMode} onChange={(event) => handlePeriodModeChange(event.target.value)}>
                    <option value="all">Todos os períodos</option>
                    <option value="day">Dia específico</option>
                    <option value="month">Mês</option>
                    <option value="year">Ano</option>
                  </select>
                </div>
                {periodMode !== 'all' && (
                  <div className="eventos-field eventos-field--period-value">
                    <label htmlFor="evento-periodo-valor">{periodMode === 'day' ? 'Data' : periodMode === 'month' ? 'Mês' : 'Ano'}</label>
                    <input id="evento-periodo-valor" type={periodMode === 'day' ? 'date' : periodMode === 'month' ? 'month' : 'number'} min={periodMode === 'year' ? '2000' : undefined} max={periodMode === 'year' ? '2100' : undefined} value={periodValue} onChange={(event) => handlePeriodValueChange(event.target.value)} />
                  </div>
                )}
                <button type="button" className="eventos-clear-button" onClick={() => { setEventoBusca(''); setEventoStatus('Todos'); clearPeriodFilter(); }}>
                  <SlidersHorizontal size={17} /> Limpar filtros
                </button>
              </div>
            </section>

            <section className="eventos-results-card eventos-table-card">
              <header>
                <h2>Solicitações <span>{eventosFiltrados.length} {eventosFiltrados.length === 1 ? 'resultado' : 'resultados'}</span></h2>
              </header>

              {eventosFiltrados.length === 0 ? (
                <div className="eventos-empty-state">
                  <span className="eventos-empty-icon"><Calendar size={44} /><XCircle size={19} /></span>
                  <h3>Nenhum evento localizado</h3>
                  <p>Não há solicitações que correspondam aos filtros aplicados.</p>
                  <button type="button" onClick={() => { setEventoBusca(''); setEventoStatus('Todos'); clearPeriodFilter(); }}>
                    <SlidersHorizontal size={17} /> Limpar filtros
                  </button>
                </div>
              ) : (
                <>
                  <div className="eventos-table-scroll">
                    <table className="eventos-table">
                      <thead>
                        <tr>
                          <th>Protocolo</th>
                          <th>Responsável</th>
                          <th>Data do evento</th>
                          <th>Local</th>
                          <th>Status</th>
                          <th>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventosPaginados.map((eve) => {
                          const finalizado = eve.status === 'Aprovado' || eve.status === 'Negado';
                          const aguardando = ['Pendente', 'Recebido', 'Aguardando Análise'].includes(eve.status);
                          return (
                            <tr key={eve.id}>
                              <td className="eventos-protocolo">{eve.numero_protocolo}</td>
                              <td>{eve.nome_solicitante || 'Não informado'}</td>
                              <td>{eve.data_evento || 'Não informada'}</td>
                              <td>{eve.local_evento || 'Não informado'}</td>
                              <td>
                                <span className={'eventos-status ' + (eve.status === 'Aprovado' ? 'is-approved' : eve.status === 'Negado' ? 'is-denied' : aguardando ? 'is-waiting' : 'is-review')}>
                                  {eve.status === 'Aprovado' ? 'Aprovada' : eve.status === 'Negado' ? 'Negada' : aguardando ? 'Aguardando análise' : 'Em análise'}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="evento-table-action"
                                  onClick={() => {
                                    setEventoFoco(eve.id);
                                    setJustificativaEvento(finalizado ? (eve.resposta_analise || '') : '');
                                  }}
                                >
                                  {finalizado ? 'Visualizar' : aguardando ? 'Analisar' : 'Continuar análise'}
                                </button>
                                <AdminRegistroActions category="eventos" id={eve.id} onSaved={carregarEventos} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="eventos-table-pagination">
                    <span>Mostrando {(eventoPage - 1) * eventoPerPage + 1}–{Math.min(eventoPage * eventoPerPage, eventosFiltrados.length)} de {eventosFiltrados.length} solicitações</span>
                    {renderPagination(eventoPage, eventosFiltrados.length, eventoPerPage, setEventoPage)}
                  </div>
                </>
              )}
            </section>

            {eventoFoco && (() => {
              const eventoSelecionado = eventos.find((item) => item.id === eventoFoco);
              if (!eventoSelecionado) return null;
              const finalizado = eventoSelecionado.status === 'Aprovado' || eventoSelecionado.status === 'Negado';

              return (
                <div className="evento-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEventoFoco(null); }}>
                  <section className="evento-modal" role="dialog" aria-modal="true" aria-labelledby="evento-modal-title">
                    <header className="evento-modal-header">
                      <div>
                        <span>Solicitação de evento</span>
                        <h2 id="evento-modal-title">{eventoSelecionado.numero_protocolo}</h2>
                      </div>
                      <button type="button" onClick={() => setEventoFoco(null)} aria-label="Fechar detalhes"><XCircle size={22} /></button>
                    </header>

                    <div className="evento-modal-body">
                      <section className="evento-modal-section">
                        <h3>Dados do responsável</h3>
                        <dl className="evento-modal-grid">
                          <div><dt>Nome</dt><dd>{eventoSelecionado.nome_solicitante || 'Não informado'}</dd></div>
                          <div><dt>CPF/CNPJ</dt><dd>{eventoSelecionado.cpf_cnpj || 'Não informado'}</dd></div>
                          <div><dt>Telefone</dt><dd>{eventoSelecionado.telefone || 'Não informado'}</dd></div>
                          <div><dt>E-mail</dt><dd>{eventoSelecionado.email || 'Não informado'}</dd></div>
                        </dl>
                      </section>

                      <section className="evento-modal-section">
                        <h3>Dados do evento e da interdição</h3>
                        <dl className="evento-modal-grid">
                          <div><dt>Data e horário</dt><dd>{eventoSelecionado.data_evento || 'Não informado'}</dd></div>
                          <div><dt>Local e vias</dt><dd>{eventoSelecionado.local_evento || 'Não informado'}</dd></div>
                        </dl>
                        {eventoSelecionado.descricao && <div className="evento-modal-description"><span>Descrição</span><p>{eventoSelecionado.descricao}</p></div>}
                        {eventoSelecionado.caminho_arquivo && (
                          <a className="evento-modal-file" href={montarUrlArquivo(eventoSelecionado.caminho_arquivo)} target="_blank" rel="noopener noreferrer">
                            <FileText size={18} /><span><strong>Requerimento anexado</strong><small>Visualizar documento enviado</small></span>
                          </a>
                        )}
                      </section>

                      <section className="evento-modal-section evento-modal-opinion">
                        <h3>Parecer técnico da SMTT</h3>
                        {finalizado ? (
                          <div className="evento-modal-final-opinion">
                            <span className={'eventos-status ' + (eventoSelecionado.status === 'Aprovado' ? 'is-approved' : 'is-denied')}>
                              {eventoSelecionado.status === 'Aprovado' ? 'Aprovada' : 'Negada'}
                            </span>
                            <p>{eventoSelecionado.resposta_analise || 'Nenhum parecer registrado.'}</p>
                          </div>
                        ) : (
                          <>
                            <label htmlFor="parecer-evento-modal">Parecer técnico *</label>
                            <textarea
                              id="parecer-evento-modal"
                              rows="5"
                              placeholder="Descreva a análise técnica e a justificativa para a decisão..."
                              value={justificativaEvento}
                              onChange={(event) => setJustificativaEvento(event.target.value)}
                              autoFocus
                            />
                          </>
                        )}
                      </section>
                    </div>

                    <footer className="evento-modal-footer">
                      <button type="button" className="evento-modal-cancel" onClick={() => setEventoFoco(null)}>{finalizado ? 'Fechar' : 'Cancelar'}</button>
                      {!finalizado && (
                        <>
                          <button type="button" className="evento-modal-deny" onClick={() => julgarEvento(eventoSelecionado.id, 'Negado')}><XCircle size={18} /> Negar solicitação</button>
                          <button type="button" className="evento-modal-approve" onClick={() => julgarEvento(eventoSelecionado.id, 'Aprovado')}><CheckCircle size={18} /> Aprovar solicitação</button>
                        </>
                      )}
                    </footer>
                  </section>
                </div>
              );
            })()}
          </div>
        ) : menuAtivo === 'alvaras' ? (
          <AdminAlvarasSection
            alvaras={alvaras}
            carregarAlvaras={carregarAlvaras}
            dateFilterControl={dateFilterControl}
            periodMode={periodMode}
            periodValue={periodValue}
            onPeriodModeChange={handlePeriodModeChange}
            onPeriodValueChange={handlePeriodValueChange}
            onClearPeriod={clearPeriodFilter}
            matchesDateFilter={matchesDateFilter}
            mensagem={mensagem}
            setMensagem={setMensagem}
          />
        ) : menuAtivo === 'infracoes' ? (
          <div className="infracoes-auditoria">
            <header className="infracoes-page-header">
              <div>
                
                <h1>Infrações Lançadas</h1>
                <p>Consulte, filtre e audite todas as autuações de trânsito registradas no município.</p>
              </div>
              <div className="infracoes-header-actions">
                <button type="button" className="infracoes-refresh" onClick={carregarInfracoes} title="Atualizar dados" aria-label="Atualizar dados"><RefreshCw size={17} /></button>
                <button type="button" className="infracoes-export" onClick={exportarInfracoes}><Download size={16} /> Exportar relatório</button>
              </div>
            </header>

            <section className="admin-count-grid" aria-label="Resumo das infrações">
              <AdminCountBadge icon={FileText} label="Total registrado" value={infracaoStats.total} description="Autos" />
              <AdminCountBadge icon={CheckCircle} label="Defesas deferidas" value={infracaoStats.canceladas} tone="green" description="Anulados" />
              <AdminCountBadge icon={XCircle} label="Multas ativas" value={infracaoStats.ativas} tone="red" description="Em cobrança" />
              <AdminCountBadge icon={FileText} label="Pontuação gerada" value={infracaoStats.pontos} description="Pontos na CNH" />
            </section>

            <section className="infracoes-filter-card">
              <header><Filter size={18} /><h2>Filtragem e auditoria avançada</h2></header>
              <div className="infracoes-filter-grid">
                <label>
                  <span>Buscar autuação</span>
                  <div className="infracoes-search-control">
                    <Search size={16} />
                    <input type="text" placeholder="Placa, número do AIT ou modelo..." value={filtroInfracao} onChange={(event) => { setFiltroInfracao(event.target.value); setInfracaoPage(1); }} />
                  </div>
                </label>
                <label>
                  <span>Gravidade</span>
                  <select value={infracaoGravidade} onChange={(event) => { setInfracaoGravidade(event.target.value); setInfracaoPage(1); }}>
                    <option value="Todos">Todas as gravidades</option><option value="Leve">Leve</option><option value="Média">Média</option><option value="Grave">Grave</option><option value="Gravíssima">Gravíssima</option>
                  </select>
                </label>
                <label>
                  <span>Fase atual</span>
                  <select value={infracaoFase} onChange={(event) => { setInfracaoFase(event.target.value); setInfracaoPage(1); }}>
                    <option value="Todos">Todas as fases</option><option value="Ativas">Ativas (com cobrança)</option><option value="Canceladas">Canceladas (deferidas)</option>
                  </select>
                </label>
                <label>
                  <span>Período de registro</span>
                  <select value={periodMode} onChange={(event) => handlePeriodModeChange(event.target.value)}>
                    <option value="all">Todos os períodos</option><option value="day">Dia específico</option><option value="month">Mês</option><option value="year">Ano</option>
                  </select>
                </label>
                {periodMode !== 'all' && (
                  <label className="infracoes-period-value">
                    <span>{periodMode === 'day' ? 'Data' : periodMode === 'month' ? 'Mês' : 'Ano'}</span>
                    <input type={periodMode === 'day' ? 'date' : periodMode === 'month' ? 'month' : 'number'} min={periodMode === 'year' ? '2000' : undefined} max={periodMode === 'year' ? '2100' : undefined} value={periodValue} onChange={(event) => handlePeriodValueChange(event.target.value)} />
                  </label>
                )}
                <button type="button" className="infracoes-clear" onClick={() => { setFiltroInfracao(''); setInfracaoGravidade('Todos'); setInfracaoFase('Todos'); clearPeriodFilter(); }}>
                  <SlidersHorizontal size={16} /> Limpar filtros
                </button>
              </div>
            </section>

            <section className="infracoes-results">
              <header>
                <span>Resultados: <strong>{infracoesFiltradas.length}</strong> encontrados</span>
                <div>
                  <button type="button" className={infracaoOrdenacao.campo === 'data_hora_infracao' ? 'is-active' : ''} onClick={() => ordenarInfracoes('data_hora_infracao')}>Data <ArrowUpDown size={12} /></button>
                  <button type="button" className={infracaoOrdenacao.campo === 'gravidade' ? 'is-active' : ''} onClick={() => ordenarInfracoes('gravidade')}>Gravidade <ArrowUpDown size={12} /></button>
                  <button type="button" className={infracaoOrdenacao.campo === 'valor_final' ? 'is-active' : ''} onClick={() => ordenarInfracoes('valor_final')}>Valor <ArrowUpDown size={12} /></button>
                </div>
              </header>

              {infracoesFiltradas.length === 0 ? (
                <div className="infracoes-empty">
                  <ShieldAlert size={43} />
                  <strong>Nenhum registro de autuação localizado.</strong>
                  <span>Altere os filtros de busca para recomeçar.</span>
                </div>
              ) : (
                <div className="infracoes-list">
                  {infracoesPaginadas.map((inf) => {
                    const estaAberto = infracaoAberta === inf.id;
                    const cancelada = infracaoCancelada(inf);
                    const gravidade = inf.tipo_infracao?.gravidade || 'Não informada';
                    const historico = [
                      { titulo: 'Autuação registrada', data: inf.data_hora_infracao },
                      ...(inf.numero_nait ? [{ titulo: 'NAIT vinculada: ' + inf.numero_nait, data: inf.data_expedicao || 'Data não informada' }] : []),
                      ...(inf.numero_nip ? [{ titulo: 'NIP vinculada: ' + inf.numero_nip, data: inf.data_vencimento_boleto ? 'Vencimento em ' + inf.data_vencimento_boleto : 'Vencimento não informado' }] : []),
                    ];

                    return (
                      <article key={inf.id} className={'infracao-audit-card ' + (cancelada ? 'is-cancelled' : '')}>
                        <button type="button" className="infracao-card-summary" onClick={() => setInfracaoAberta(estaAberto ? null : inf.id)} aria-expanded={estaAberto}>
                          <div className="infracao-plate">
                            <span><i>BRASIL</i><i>{inf.veiculo?.uf || 'SE'}</i></span>
                            <strong>{inf.veiculo?.placa || 'SEM PLACA'}</strong>
                          </div>
                          <div className="infracao-summary-copy">
                            <div>
                              <h3>AIT <strong>{inf.numero_ait}</strong></h3>
                              <span className={'infracao-fase ' + (cancelada ? 'is-cancelled' : (inf.fase_atual || '').includes('Penalidade') ? 'is-penalty' : '')}>{inf.fase_atual || 'Autuação'}</span>
                              <span className={'infracao-gravidade is-' + normalizeString(gravidade).replace('í', 'i')}>{gravidade}</span>
                            </div>
                            <p><Calendar size={14} /> {inf.data_hora_infracao || 'Data não informada'}</p>
                            <p><MapPin size={14} /> {inf.local_cometimento || 'Local não informado'}</p>
                          </div>
                          <div className="infracao-summary-value">
                            <small>Valor da multa</small>
                            <strong className={cancelada ? 'is-cancelled' : ''}>{Number(inf.valor_final || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                            <span>{estaAberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}{estaAberto ? 'Recolher' : 'Detalhes'}</span>
                          </div>
                        </button>

                        <div className="px-5 pb-3 flex justify-end"><AdminRegistroActions category="infracoes" id={inf.id} onSaved={carregarInfracoes} /></div>

                        {estaAberto && (
                          <div className="infracao-card-details">
                            <div className="infracao-details-grid">
                              <section>
                                <h4>Veículo cadastrado</h4>
                                <dl>
                                  <div><dt>Marca / Modelo</dt><dd>{inf.veiculo?.marca_modelo || 'Não informado'}</dd></div>
                                  <div><dt>Cor oficial</dt><dd>{inf.veiculo?.cor || 'Não informada'}</dd></div>
                                  <div><dt>Ano de fabricação</dt><dd>{inf.veiculo?.ano_fabricacao || 'Não informado'}</dd></div>
                                  <div><dt>UF do registro</dt><dd>{inf.veiculo?.uf || 'SE'}</dd></div>
                                  <div><dt>Renavam</dt><dd>{inf.veiculo?.renavam || 'Não informado'}</dd></div>
                                </dl>
                              </section>

                              <section>
                                <h4>Enquadramento e amparo CTB</h4>
                                <dl>
                                  <div><dt>Código</dt><dd>{inf.tipo_infracao?.codigo_infracao || 'Não informado'}</dd></div>
                                  <div><dt>Amparo legal</dt><dd>{inf.tipo_infracao?.amparo_legal || 'Não informado'}</dd></div>
                                  <div className="is-full"><dt>Descrição</dt><dd>{inf.tipo_infracao?.descricao || 'Não informada'}</dd></div>
                                  <div><dt>Gravidade</dt><dd>{gravidade}</dd></div>
                                  <div><dt>Pontuação</dt><dd>{inf.tipo_infracao?.pontos || 0} pontos</dd></div>
                                </dl>
                              </section>

                              <section>
                                <h4>Dados operacionais e medições</h4>
                                <dl>
                                  <div><dt>Agente / Aparelho</dt><dd>{inf.agente_aparelho || 'Não informado'}</dd></div>
                                  <div><dt>Desdobramento</dt><dd>{inf.desdobramento || '1'}</dd></div>
                                  <div><dt>Medição regulamentada</dt><dd>{inf.medicao_regulamentada || 'Não informada'}</dd></div>
                                  <div><dt>Medição aferida</dt><dd>{inf.medicao_aferida || 'Não informada'}</dd></div>
                                  <div><dt>Medição considerada</dt><dd>{inf.medicao_considerada || 'Não informada'}</dd></div>
                                  <div><dt>Código Renainf</dt><dd>{inf.codigo_renainf || 'Não informado'}</dd></div>
                                </dl>
                              </section>
                            </div>

                            <section className="infracao-process">
                              <h4><Clock3 size={14} /> Histórico legal da autuação</h4>
                              <ol>
                                {historico.map((item, index) => <li key={item.titulo + index}><span /><div><strong>{item.titulo}</strong><small>{item.data}</small></div></li>)}
                              </ol>
                            </section>

                            <section className="infracao-fiscal">
                              <div><span>NAIT</span><strong>{inf.numero_nait || 'Não vinculada'}</strong><small>{inf.data_expedicao ? 'Expedida em ' + inf.data_expedicao : 'Sem data de expedição'}</small></div>
                              <div><span>NIP</span><strong>{inf.numero_nip || 'Não vinculada'}</strong><small>{inf.data_vencimento_boleto ? 'Vence em ' + inf.data_vencimento_boleto : 'Sem vencimento'}</small></div>
                              <div><span>Defesa prévia</span><strong>{inf.data_vencimento_defesa || 'Sem vencimento'}</strong><small>Prazo cadastrado</small></div>
                              <div className="infracao-fiscal-actions">
                                <button type="button" onClick={() => abrirModalNait(inf)}>{inf.numero_nait ? 'Editar NAIT' : 'Vincular NAIT'}</button>
                                {inf.numero_nait && <button type="button" className="is-nip" onClick={() => abrirModalNip(inf)}>{inf.numero_nip ? 'Editar NIP' : 'Vincular NIP'}</button>}
                              </div>
                              {inf.linha_digitavel && <code>{inf.linha_digitavel}</code>}
                            </section>
                          </div>
                        )}
                      </article>
                    );
                  })}
                  {renderPagination(infracaoPage, infracoesFiltradas.length, infracaoPerPage, setInfracaoPage)}
                </div>
              )}
            </section>
          </div>
        ) : menuAtivo === 'noticias' ? (
          <div className="noticias-admin">
            <header className="news-page-header">
              <nav className="news-breadcrumb" aria-label="Navegação estrutural">
                <button type="button" onClick={() => handleMenuClick('recursos')}>Início</button>
                <ChevronRight size={14} />
                <span>Gestão de Notícias</span>
              </nav>
              <div className="news-title-row">
                <div>
                  <h1>Gestão de Notícias</h1>
                  <p>Publique, edite e organize as matérias e comunicados oficiais do portal público.</p>
                </div>
                <button
                  type="button"
                  className={exibindoFormNews ? 'news-button news-button-outline' : 'news-button news-button-primary'}
                  onClick={exibindoFormNews ? limparFormNoticia : prepararNovaNoticia}
                >
                  <i className={exibindoFormNews ? 'fa-solid fa-list' : 'fa-solid fa-plus'} />
                  {exibindoFormNews ? 'Ver notícias publicadas' : 'Cadastrar notícia'}
                </button>
              </div>
            </header>

            {mensagem && (
              <div className="news-feedback" role="status">
                <CheckCircle size={19} />
                <span>{mensagem}</span>
              </div>
            )}

            {exibindoFormNews ? (
              <>
                <form onSubmit={salvarNoticia} className="news-compose-layout">
                  <section className="news-compose-card news-content-card">
                    <div className="news-card-heading">
                      <span className="news-heading-icon"><FileText size={19} /></span>
                      <div>
                        <h2>{modoEdicaoNews ? 'Editar conteúdo da notícia' : 'Conteúdo da notícia'}</h2>
                        <p>Escreva um título claro e uma matéria fácil de ler.</p>
                      </div>
                    </div>

                    <div className="news-field">
                      <div className="news-label-row">
                        <label htmlFor="news-title">Título da matéria <b>*</b></label>
                        <span>{tituloNews.length}/140</span>
                      </div>
                      <input
                        id="news-title"
                        type="text"
                        required
                        maxLength="140"
                        placeholder="Ex.: Novos semáforos inteligentes são instalados no Centro"
                        value={tituloNews}
                        onChange={(e) => setTituloNews(e.target.value)}
                      />
                    </div>

                    <div className="news-field">
                      <div className="news-label-row">
                        <label htmlFor="news-subtitle">Subtítulo ou resumo</label>
                        <span>{subtituloNews.length}/240</span>
                      </div>
                      <small>Opcional · aparece na listagem das notícias.</small>
                      <input
                        id="news-subtitle"
                        type="text"
                        maxLength="240"
                        placeholder="Breve resumo que aparece nos cards do portal..."
                        value={subtituloNews}
                        onChange={(e) => setSubtituloNews(e.target.value)}
                      />
                    </div>

                    <div className="news-field news-editor-field">
                      <div className="news-label-row">
                        <label htmlFor="news-content">Conteúdo / matéria completa <b>*</b></label>
                        <span>{conteudoNews.length} caracteres</span>
                      </div>
                      <div className="news-editor-shell">
                        <div className="news-editor-toolbar" aria-label="Ferramentas de formatação">
                          <span>Parágrafo</span>
                          <button type="button" title="Negrito" onClick={() => aplicarFormatoNoticia('**', '**', 'texto')}><b>B</b></button>
                          <button type="button" title="Itálico" onClick={() => aplicarFormatoNoticia('_', '_', 'texto')}><i>I</i></button>
                          <button type="button" title="Título" onClick={() => aplicarFormatoNoticia('\n## ', '', 'Título')}>H2</button>
                          <button type="button" title="Subtítulo" onClick={() => aplicarFormatoNoticia('\n### ', '', 'Subtítulo')}>H3</button>
                          <span className="news-toolbar-divider" />
                          <button type="button" title="Lista" onClick={() => aplicarFormatoNoticia('\n- ', '', 'Item da lista')}><i className="fa-solid fa-list-ul" /></button>
                          <button type="button" title="Link" onClick={() => aplicarFormatoNoticia('[', '](https://)', 'texto do link')}><i className="fa-solid fa-link" /></button>
                          <button type="button" title="Alinhar à esquerda" onClick={() => conteudoNewsRef.current?.focus()}><i className="fa-solid fa-align-left" /></button>
                        </div>
                        <textarea
                          ref={conteudoNewsRef}
                          id="news-content"
                          rows="15"
                          required
                          placeholder="Digite o texto da notícia..."
                          value={conteudoNews}
                          onChange={(e) => setConteudoNews(e.target.value)}
                        />
                      </div>
                      <small>A barra insere marcações simples que preservam o conteúdo em texto.</small>
                    </div>
                  </section>

                  <aside className="news-compose-card news-settings-card">
                    <div className="news-card-heading">
                      <span className="news-heading-icon"><SlidersHorizontal size={19} /></span>
                      <div>
                        <h2>Configurações da publicação</h2>
                        <p>Defina a classificação e a apresentação.</p>
                      </div>
                    </div>

                    <div className="news-field">
                      <label htmlFor="news-category">Categoria <b>*</b></label>
                      <select id="news-category" value={categoriaNews} onChange={(e) => setCategoriaNews(e.target.value)}>
                        <option value="Geral">Geral</option>
                        <option value="Educação">Educação</option>
                        <option value="Mobilidade">Mobilidade</option>
                        <option value="Infraestrutura">Infraestrutura</option>
                        <option value="Comunicados">Comunicados</option>
                      </select>
                    </div>

                    <div className="news-field">
                      <label>Imagem de capa</label>
                      <small>PNG, JPG ou WebP · máximo recomendado de 5 MB · proporção 1,9:1.</small>
                      <input id="news-cover-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={selecionarImagemNews} hidden />
                      <label htmlFor="news-cover-input" className={`news-image-dropzone ${imagemPreviewNews ? 'has-image' : ''}`}>
                        {imagemPreviewNews ? (
                          <>
                            <img src={imagemPreviewNews} alt="Prévia da imagem de capa" />
                            <span><Upload size={16} /> Clique para substituir a imagem</span>
                          </>
                        ) : (
                          <>
                            <span className="news-upload-icon"><i className="fa-regular fa-image" /></span>
                            <strong>Clique para selecionar uma imagem</strong>
                            <small>Recomendado: 1200 × 630 px</small>
                          </>
                        )}
                      </label>
                      {modoEdicaoNews && noticiaFoco?.imagem_url && !imagemNews && (
                        <small>A imagem atual será mantida se nenhum novo arquivo for selecionado.</small>
                      )}
                    </div>

                    <div className="news-publication-status">
                      <span>Status da publicação</span>
                      <strong><i /> {modoEdicaoNews ? 'Edição não publicada' : 'Rascunho local'}</strong>
                      <small>A notícia só ficará pública após confirmar a publicação.</small>
                    </div>

                    <div className="news-form-actions">
                      {!modoEdicaoNews && (
                        <button type="button" className="news-button news-button-muted" onClick={salvarRascunhoNoticia}>
                          <i className="fa-regular fa-floppy-disk" /> Salvar rascunho
                        </button>
                      )}
                      <button
                        type="button"
                        className="news-button news-button-outline"
                        disabled={!tituloNews.trim() || !conteudoNews.trim()}
                        onClick={() => setPreviewNoticiaAberta(true)}
                      >
                        <i className="fa-regular fa-eye" /> Pré-visualizar
                      </button>
                      <button type="submit" className="news-button news-button-primary">
                        <i className="fa-regular fa-paper-plane" />
                        {modoEdicaoNews ? 'Atualizar notícia' : 'Publicar notícia'}
                      </button>
                      <button type="button" className="news-cancel-action" onClick={limparFormNoticia}>Cancelar</button>
                    </div>
                  </aside>
                </form>

                <section className="news-published-strip">
                  <div className="news-strip-title">
                    <i className="fa-solid fa-list" />
                    <div><strong>Notícias publicadas</strong><small>{noticias.length} {noticias.length === 1 ? 'matéria cadastrada' : 'matérias cadastradas'}</small></div>
                  </div>
                  <div className="news-strip-search"><Search size={16} /><span>Localize e gerencie o conteúdo já publicado</span></div>
                  <button type="button" className="news-button news-button-outline" onClick={limparFormNoticia}>Ver lista <ChevronRight size={16} /></button>
                </section>

                {previewNoticiaAberta && (
                  <div className="news-preview-backdrop" role="presentation" onMouseDown={() => setPreviewNoticiaAberta(false)}>
                    <article className="news-preview-modal" role="dialog" aria-modal="true" aria-labelledby="news-preview-title" onMouseDown={(e) => e.stopPropagation()}>
                      <header>
                        <div><small>Pré-visualização da notícia</small><strong>Como o conteúdo será apresentado</strong></div>
                        <button type="button" aria-label="Fechar pré-visualização" onClick={() => setPreviewNoticiaAberta(false)}><i className="fa-solid fa-xmark" /></button>
                      </header>
                      {imagemPreviewNews && <img className="news-preview-cover" src={imagemPreviewNews} alt="" />}
                      <div className="news-preview-body">
                        <span>{categoriaNews}</span>
                        <h2 id="news-preview-title">{tituloNews}</h2>
                        {subtituloNews && <p className="news-preview-lead">{subtituloNews}</p>}
                        <div className="news-preview-copy">{conteudoNews}</div>
                      </div>
                    </article>
                  </div>
                )}
              </>
            ) : (
              <>
                {dateFilterControl}
                <section className="news-list-card">
                  <div className="news-list-heading">
                    <div><h2>Notícias publicadas</h2><span>{noticiasFiltradas.length} resultados</span></div>
                    <p>Edite, revise ou remova conteúdos do portal.</p>
                  </div>

                  <div className="news-list-filters">
                    <label>
                      <span>Buscar matéria</span>
                      <div><Search size={17} /><input type="text" placeholder="Título, subtítulo ou conteúdo..." value={noticiaBusca} onChange={(e) => { setNoticiaBusca(e.target.value); setNoticiaPage(1); }} /></div>
                    </label>
                    <label>
                      <span>Categoria</span>
                      <select value={noticiaFiltroCategoria} onChange={(e) => { setNoticiaFiltroCategoria(e.target.value); setNoticiaPage(1); }}>
                        <option value="Todos">Todas as categorias</option>
                        <option value="Geral">Geral</option>
                        <option value="Educação">Educação</option>
                        <option value="Mobilidade">Mobilidade</option>
                        <option value="Infraestrutura">Infraestrutura</option>
                        <option value="Comunicados">Comunicados</option>
                      </select>
                    </label>
                  </div>

                  {noticiasFiltradas.length === 0 ? (
                    <div className="news-empty-state">
                      <i className="fa-regular fa-newspaper" />
                      <strong>Nenhuma notícia localizada</strong>
                      <span>Não há matérias que correspondam aos filtros aplicados.</span>
                    </div>
                  ) : (
                    <div className="news-items-list">
                      {noticiasPaginadas.map((item) => (
                        <article key={item.id} className="news-list-item">
                          <div className="news-list-thumb">
                            {item.imagem_url ? <img src={montarUrlArquivo(item.imagem_url)} alt="" /> : <i className="fa-regular fa-newspaper" />}
                          </div>
                          <div className="news-list-copy">
                            <div><span>{item.categoria}</span><small><Calendar size={13} /> {item.criado_em}</small></div>
                            <h3>{item.titulo}</h3>
                            {item.subtitulo && <p>{item.subtitulo}</p>}
                          </div>
                          <div className="news-list-actions">
                            <button type="button" onClick={() => prepararEdicaoNoticia(item)}><i className="fa-regular fa-pen-to-square" /> Editar</button>
                            <button type="button" className="is-danger" onClick={() => deletarNoticia(item.id)}><i className="fa-regular fa-trash-can" /> Excluir</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                  {renderPagination(noticiaPage, noticiasFiltradas.length, noticiaPerPage, setNoticiaPage)}
                </section>
              </>
            )}
          </div>
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

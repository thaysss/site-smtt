import AdminCountBadge from './AdminCountBadge';
import AdminRegistroActions from './AdminRegistroActions';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Eye, CheckCircle, XCircle, FileText, Upload,
  ChevronLeft, ChevronRight, X, ShieldCheck, Inbox, Clock3,
  SlidersHorizontal, RotateCcw, CalendarDays, ArrowUpDown, Home
} from 'lucide-react';
import api from '../services/api';

const TIPOS_ALVARA = [
  'Renovação de Alvará',
  'Inclusão de Permissionário',
];

const DOCUMENTOS = [
  { key: 'caminho_requerimento', label: 'Requerimento' },
  { key: 'caminho_cnh', label: 'CNH' },
  { key: 'caminho_crlv', label: 'CRLV' },
  { key: 'caminho_titulo_eleitoral', label: 'Título Eleitoral' },
  { key: 'caminho_certidao_eleitoral', label: 'Certidão Eleitoral' },
  { key: 'caminho_antecedentes_criminais', label: 'Antecedentes Criminais' },
  { key: 'caminho_comprovante_endereco', label: 'Comprovante de Endereço' },
  { key: 'caminho_certificado_curso', label: 'Certificado do Curso' },
  { key: 'caminho_cadastro_cnis', label: 'Cadastro CNIS' },
  { key: 'caminho_regularidade_cnis', label: 'Regularidade CNIS' },
  { key: 'caminho_foto', label: 'Foto 3/4' },
  { key: 'caminho_fator_rh', label: 'Comprovante de Sangue/RH' },
  { key: 'caminho_cnh_auxiliar', label: 'CNH do Auxiliar' },
  { key: 'caminho_crlv_auxiliar', label: 'CRLV do Auxiliar' },
  { key: 'caminho_titulo_eleitoral_auxiliar', label: 'Título do Auxiliar' },
  { key: 'caminho_certidao_eleitoral_auxiliar', label: 'Certidão do Auxiliar' },
  { key: 'caminho_antecedentes_criminais_auxiliar', label: 'Antecedentes do Auxiliar' },
  { key: 'caminho_comprovante_endereco_auxiliar', label: 'Endereço do Auxiliar' },
  { key: 'caminho_certificado_curso_auxiliar', label: 'Curso do Auxiliar' },
  { key: 'caminho_cadastro_cnis_auxiliar', label: 'CNIS do Auxiliar' },
  { key: 'caminho_regularidade_cnis_auxiliar', label: 'Regularidade do Auxiliar' },
  { key: 'caminho_foto_auxiliar', label: 'Foto do Auxiliar' },
  { key: 'caminho_fator_rh_auxiliar', label: 'Fator RH do Auxiliar' },
];

const apiBaseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
const montarUrlArquivo = (caminho) => {
  if (!caminho) return '';
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return `${apiBaseUrl}${caminho}`;
};

function AdminAlvarasSection({
  alvaras = [],
  carregarAlvaras,
  periodMode,
  periodValue,
  onPeriodModeChange,
  onPeriodValueChange,
  onClearPeriod,
  matchesDateFilter,
  mensagem,
  setMensagem
}) {
  const navigate = useNavigate();

  // Filters state
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filtrosAvancados, setFiltrosAvancados] = useState(false);

  // Selected item modal state
  const [alvaraSelecionado, setAlvaraSelecionado] = useState(null);
  const [justificativa, setJustificativa] = useState('');
  const [arquivoEmitido, setArquivoEmitido] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!alvaraSelecionado) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !processando) setAlvaraSelecionado(null);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [alvaraSelecionado, processando]);

  // Normalize helpers for search
  const normalizeStr = (str) =>
    (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const normalizePlaca = (str) => (str || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // Filter logic
  const alvarasFiltrados = alvaras.filter((alv) => {
    // Period date filter
    if (matchesDateFilter && !matchesDateFilter(alv.criado_em, periodMode, periodValue)) {
      return false;
    }

    // Status filter
    if (statusFiltro !== '') {
      if (statusFiltro === 'analise' && alv.status !== 'Em Análise') return false;
      if (statusFiltro === 'ativo' && alv.status !== 'Aprovado' && alv.status !== 'Ativo') return false;
      if (statusFiltro === 'vencido' && alv.status !== 'Vencido') return false;
      if (statusFiltro === 'negado' && alv.status !== 'Negado') return false;
      if (statusFiltro !== 'analise' && statusFiltro !== 'ativo' && statusFiltro !== 'vencido' && statusFiltro !== 'negado') {
        if (alv.status !== statusFiltro) return false;
      }
    }

    // Tipo filter
    if (tipoFiltro !== '') {
      const tipoLower = normalizeStr(alv.tipo_servico);
      const filterLower = normalizeStr(tipoFiltro);
      if (!tipoLower.includes(filterLower)) return false;
    }

    // Search query filter
    if (busca.trim() !== '') {
      const q = normalizeStr(busca);
      const prot = normalizeStr(alv.numero_protocolo);
      const sol = normalizeStr(alv.nome_solicitante);
      const cpf = (alv.cpf || '').replace(/\D/g, '');
      const qCpf = busca.replace(/\D/g, '');
      const placa = normalizePlaca(alv.placa_veiculo);
      const qPlaca = normalizePlaca(busca);

      const matchesText = prot.includes(q) || sol.includes(q);
      const matchesCpf = qCpf !== '' && cpf.includes(qCpf);
      const matchesPlaca = qPlaca !== '' && placa.includes(qPlaca);

      if (!matchesText && !matchesCpf && !matchesPlaca) return false;
    }

    return true;
  });

  // Pagination calculation
  const totalPages = Math.ceil(alvarasFiltrados.length / perPage) || 1;
  const pageSeguro = Math.min(page, totalPages);
  const startIndex = (pageSeguro - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, alvarasFiltrados.length);
  const alvarasPaginados = alvarasFiltrados.slice(startIndex, endIndex);
  const totalAlvaras = alvaras.length;
  const totalAprovados = alvaras.filter((item) => item.status === 'Aprovado' || item.status === 'Ativo').length;
  const totalAnalise = alvaras.filter((item) => item.status === 'Em Análise').length;
  const totalIndeferidos = alvaras.filter((item) => item.status === 'Negado' || item.status === 'Indeferido').length;
  const percentual = (valor) => (totalAlvaras ? Math.round((valor / totalAlvaras) * 100) : 0);
  const paginasVisiveis = useMemo(() => {
    const inicio = Math.max(1, Math.min(pageSeguro - 2, totalPages - 4));
    const fim = Math.min(totalPages, inicio + 4);
    return Array.from({ length: fim - inicio + 1 }, (_, index) => inicio + index);
  }, [pageSeguro, totalPages]);

  const abrirDetalhes = (alvara) => {
    setAlvaraSelecionado(alvara);
    setJustificativa('');
    setArquivoEmitido(null);
    setErro('');
  };

  const fecharDetalhes = () => {
    if (processando) return;
    setAlvaraSelecionado(null);
    setErro('');
  };

  const limparFiltros = () => {
    setBusca('');
    setTipoFiltro('');
    setStatusFiltro('');
    setPage(1);
    if (onClearPeriod) onClearPeriod();
  };

  // Submit judgement
  const handleJulgar = async (id, decisao) => {
    if (!justificativa.trim()) {
      setErro('Informe a justificativa ou o parecer técnico antes de continuar.');
      return;
    }
    if (decisao === 'Aprovado' && !arquivoEmitido) {
      setErro('Anexe o PDF do alvará digital emitido para aprovar a solicitação.');
      return;
    }

    try {
      setProcessando(true);
      setErro('');
      const formData = new FormData();
      formData.append('decisao', decisao);
      formData.append('justificativa_jari', justificativa);
      if (arquivoEmitido) {
        formData.append('arquivo_alvara', arquivoEmitido);
      }

      await api.put(`/admin/alvaras/${id}/julgar`, formData);

      if (setMensagem) setMensagem(`Solicitação de alvará ${decisao.toLowerCase()} com sucesso!`);
      setJustificativa('');
      setArquivoEmitido(null);
      setAlvaraSelecionado(null);
      if (carregarAlvaras) await carregarAlvaras();
    } catch (err) {
      console.error(err);
      setErro(err.response?.data?.erro || 'Não foi possível registrar a decisão. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  };

  const renderStatusBadge = (status) => {
    if (status === 'Aprovado' || status === 'Ativo') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          Ativo
        </span>
      );
    }
    if (status === 'Em Análise') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
          Em Análise
        </span>
      );
    }
    if (status === 'Vencido') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
          Vencido
        </span>
      );
    }
    if (status === 'Negado') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
          Negado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold">
        {status || 'Pendente'}
      </span>
    );
  };

  return (
    <div className="alvaras-consulta w-full">
      <nav className="alvaras-breadcrumb" aria-label="Navegação estrutural">
        <Home size={14} /><ChevronRight size={13} /><span>Alvarás</span><ChevronRight size={13} /><strong>Consulta</strong>
      </nav>

      <header className="alvaras-page-header">
        <div className="alvaras-title-wrap">
          <span className="alvaras-title-icon"><FileText size={29} /></span>
          <div><h1>Consulta de Alvarás</h1><p>Gerenciamento e acompanhamento de solicitações recebidas.</p></div>
        </div>
        <button type="button" onClick={() => navigate('/solicitacao-alvara')} className="alvaras-primary-button"><Plus size={21} />Novo Alvará</button>
      </header>

      <section className="admin-count-grid" aria-label="Resumo dos alvarás">
        <AdminCountBadge icon={FileText} label="Total de alvarás" value={totalAlvaras} description="Todos os pedidos" />
        <AdminCountBadge icon={CheckCircle} label="Aprovados" value={totalAprovados} tone="green" description={`${percentual(totalAprovados)}% do total`} />
        <AdminCountBadge icon={Clock3} label="Em análise" value={totalAnalise} tone="amber" description={`${percentual(totalAnalise)}% do total`} />
        <AdminCountBadge icon={XCircle} label="Indeferidos" value={totalIndeferidos} tone="red" description={`${percentual(totalIndeferidos)}% do total`} />
      </section>

      {mensagem && <div role="status" className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm mb-6 border border-emerald-200 flex items-start gap-3 font-medium"><CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />{mensagem}</div>}

      <section className="alvaras-filter-card" aria-label="Filtros da consulta">
        <form className="alvaras-filter-grid" onSubmit={(event) => event.preventDefault()}>
          <div className="alvaras-field alvaras-field--search">
            <label htmlFor="busca-alvara"><Search size={14} /> Buscar alvará</label>
            <div className="alvaras-control-wrap">
              <Search aria-hidden="true" size={18} />
              <input id="busca-alvara" placeholder="Protocolo, nome, CPF ou placa..." type="text" value={busca} onChange={(event) => { setBusca(event.target.value); setPage(1); }} />
            </div>
          </div>

          <div className="alvaras-field">
            <label htmlFor="tipo-alvara">Tipo de solicitação</label>
            <select id="tipo-alvara" value={tipoFiltro} onChange={(event) => { setTipoFiltro(event.target.value); setPage(1); }}>
              <option value="">Todos os Tipos</option>
              {TIPOS_ALVARA.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
            </select>
          </div>

          <div className="alvaras-field">
            <label htmlFor="status-alvara">Status</label>
            <select id="status-alvara" value={statusFiltro} onChange={(event) => { setStatusFiltro(event.target.value); setPage(1); }}>
              <option value="">Todos os Status</option><option value="analise">Em Análise</option><option value="ativo">Ativo / Aprovado</option><option value="vencido">Vencido</option><option value="negado">Indeferido</option>
            </select>
          </div>

          <div className="alvaras-field">
            <label htmlFor="periodo-alvara">Período</label>
            <div className="alvaras-control-wrap alvaras-control-wrap--calendar">
              <CalendarDays aria-hidden="true" size={17} />
              <select id="periodo-alvara" value={periodMode || 'all'} onChange={(event) => onPeriodModeChange?.(event.target.value)}>
                <option value="all">Todos os períodos</option><option value="day">Dia específico</option><option value="month">Mês</option><option value="year">Ano</option>
              </select>
            </div>
          </div>

          {filtrosAvancados && periodMode && periodMode !== 'all' && (
            <div className="alvaras-field alvaras-field--period-value">
              <label htmlFor="periodo-valor">{periodMode === 'day' ? 'Data' : periodMode === 'month' ? 'Mês' : 'Ano'}</label>
              <input id="periodo-valor" type={periodMode === 'day' ? 'date' : periodMode === 'month' ? 'month' : 'number'} min={periodMode === 'year' ? '2000' : undefined} max={periodMode === 'year' ? '2100' : undefined} value={periodValue || ''} onChange={(event) => onPeriodValueChange?.(event.target.value)} />
            </div>
          )}

          <div className="alvaras-filter-actions">
            <button type="button" className="alvaras-advanced" onClick={() => setFiltrosAvancados((value) => !value)} aria-expanded={filtrosAvancados}><SlidersHorizontal size={16} /> Filtros avançados</button>
            <div>
              <button type="button" className="alvaras-clear-button" onClick={limparFiltros}><RotateCcw size={17} /> Limpar filtros</button>
              <button type="submit" className="alvaras-search-button"><Search size={18} /> Pesquisar</button>
            </div>
          </div>
        </form>
      </section>

      <section className="alvaras-results-card">
        <header className="alvaras-results-header">
          <h2><FileText size={21} /> Resultados da consulta</h2>
          <label><span className="sr-only">Registros por página</span><select value={perPage} onChange={(event) => { setPerPage(Number(event.target.value)); setPage(1); }}><option value="10">10 registros por página</option><option value="20">20 registros por página</option><option value="50">50 registros por página</option></select></label>
        </header>

        <div className="overflow-x-auto alvaras-table-wrap">
          <table className="w-full text-left border-collapse">
            <thead><tr><th>PROTOCOLO <ArrowUpDown size={12} /></th><th>REQUERENTE <ArrowUpDown size={12} /></th><th>TIPO <ArrowUpDown size={12} /></th><th>DATA SOLICITAÇÃO <ArrowUpDown size={12} /></th><th>STATUS <ArrowUpDown size={12} /></th><th className="text-right">AÇÕES</th></tr></thead>
            <tbody className="divide-y divide-gray-200 bg-white text-sm text-gray-900">
              {alvarasFiltrados.length === 0 ? (
                <tr><td colSpan="6"><div className="alvaras-empty-state"><FileText size={45} /><p>Nenhum alvará localizado</p><span>Tente ajustar os filtros de busca acima ou registre um novo alvará.</span><button type="button" onClick={() => navigate('/solicitacao-alvara')}><Plus size={16} /> Cadastrar novo alvará</button></div></td></tr>
              ) : (
                alvarasPaginados.map((alv) => {
                  const numExibicao = alv.numero_protocolo || ('ALV-' + alv.id);
                  const dataSolicitacao = alv.criado_em || '-';
                  return (
                    <tr key={alv.id}>
                      <td className="font-bold text-[#1267bd]">{numExibicao}</td>
                      <td className="font-medium text-gray-800">{alv.nome_solicitante || 'Não informado'}</td>
                      <td className="text-gray-600">{alv.tipo_servico || 'Alvará'}</td>
                      <td className="text-gray-600">{dataSolicitacao}</td>
                      <td>{renderStatusBadge(alv.status)}</td>
                      <td className="text-right"><button type="button" onClick={() => abrirDetalhes(alv)} className="alvaras-view-button" title="Ver detalhes" aria-label={'Ver detalhes do protocolo ' + numExibicao}><Eye size={18} /></button><AdminRegistroActions category="alvaras" id={alv.id} onSaved={carregarAlvaras} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className="alvaras-pagination">
          <span>{alvarasFiltrados.length > 0 ? ('Mostrando ' + (startIndex + 1) + ' a ' + endIndex + ' de ' + alvarasFiltrados.length + ' registros') : 'Mostrando 0 de 0 registros'}</span>
          <div>
            <button type="button" disabled={pageSeguro <= 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))} aria-label="Página anterior"><ChevronLeft size={16} /></button>
            {paginasVisiveis.map((pNum) => <button key={pNum} type="button" onClick={() => setPage(pNum)} className={pNum === pageSeguro ? 'is-current' : ''} aria-current={pNum === pageSeguro ? 'page' : undefined} aria-label={'Página ' + pNum}>{pNum}</button>)}
            <button type="button" disabled={pageSeguro >= totalPages} onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} aria-label="Próxima página"><ChevronRight size={16} /></button>
          </div>
        </footer>
      </section>

      {/* Modal de Detalhes e Julgamento */}
      {alvaraSelecionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onMouseDown={(event) => event.target === event.currentTarget && fecharDetalhes()}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="titulo-detalhes-alvara" className="bg-surface-container-lowest rounded-2xl border border-outline-variant max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 relative">
            <button
              type="button"
              onClick={fecharDetalhes}
              disabled={processando}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-all disabled:opacity-50"
              aria-label="Fechar detalhes"
            >
              <X size={22} />
            </button>

            <div className="flex items-center gap-3 flex-wrap mb-4 pr-10">
              <h2 id="titulo-detalhes-alvara" className="text-2xl font-bold text-primary font-headline-md">
                Solicitação: <span className="text-secondary">{alvaraSelecionado.numero_protocolo || `ALV-${alvaraSelecionado.id}`}</span>
              </h2>
              {renderStatusBadge(alvaraSelecionado.status)}
            </div>

            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant mb-6 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><strong className="text-on-surface">Requerente:</strong> {alvaraSelecionado.nome_solicitante || 'Não informado'}</div>
                <div><strong className="text-on-surface">CPF:</strong> {alvaraSelecionado.cpf || 'Não informado'}</div>
                <div><strong className="text-on-surface">E-mail:</strong> {alvaraSelecionado.email || 'Não informado'}</div>
                <div><strong className="text-on-surface">Telefone:</strong> {alvaraSelecionado.telefone || 'Não informado'}</div>
                <div><strong className="text-on-surface">Tipo de Serviço:</strong> {alvaraSelecionado.tipo_servico || 'Alvará'}</div>
                <div><strong className="text-on-surface">Placa do Veículo:</strong> {alvaraSelecionado.placa_veiculo || 'Não informada'}</div>
                <div><strong className="text-on-surface">Fator RH:</strong> {alvaraSelecionado.fator_rh || 'Não informado'}</div>
                <div><strong className="text-on-surface">Data Solicitação:</strong> {alvaraSelecionado.criado_em || '-'}</div>
              </div>

              {alvaraSelecionado.tem_auxiliar && (
                <div className="mt-4 pt-3 border-t border-outline-variant/60 bg-secondary-fixed/20 p-3 rounded-lg">
                  <p className="text-xs font-bold uppercase tracking-wider text-secondary mb-1 flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Condutor Auxiliar (Defensor)
                  </p>
                  <p className="text-sm text-on-surface">
                    Nome: <strong>{alvaraSelecionado.nome_auxiliar || 'Não informado'}</strong> | CPF: <strong>{alvaraSelecionado.cpf_auxiliar || 'Não informado'}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Documentos Anexados */}
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-3">Documentos Anexados pelo Requerente</h3>
              <div className="flex flex-wrap gap-2">
                {DOCUMENTOS.map((doc) => {
                  const path = alvaraSelecionado[doc.key];
                  if (!path) return null;
                  return (
                    <a
                      key={doc.key}
                      href={montarUrlArquivo(path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface-container-high text-on-surface hover:bg-primary-fixed hover:text-on-primary-fixed rounded-lg border border-outline-variant transition-all"
                    >
                      <FileText className="w-3.5 h-3.5 text-secondary" />
                      {doc.label}
                    </a>
                  );
                })}
                {!DOCUMENTOS.some((doc) => alvaraSelecionado[doc.key]) && (
                  <div className="w-full flex items-center gap-2 rounded-lg border border-dashed border-outline-variant p-3 text-sm text-on-surface-variant">
                    <Inbox size={18} /> Nenhum documento foi anexado a esta solicitação.
                  </div>
                )}
              </div>
            </div>

            {/* Parecer Técnico e Análise */}
            {alvaraSelecionado.status === 'Em Análise' ? (
              <div className="border-t border-outline-variant pt-5">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wide mb-2">
                  Parecer Técnico SMTT *
                </label>
                <textarea
                  rows="3"
                  placeholder="Escreva o parecer técnico sobre a emissão/autorização de alvará..."
                  value={justificativa}
                  onChange={(e) => {
                    setJustificativa(e.target.value);
                    setErro('');
                  }}
                  className="w-full p-3 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all mb-4 text-sm font-medium"
                />

                <div className="mb-5">
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-outline" /> Anexar Alvará Digital Emitido (Obrigatório para Aprovação)
                  </label>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => {
                      setArquivoEmitido(e.target.files?.[0] || null);
                      setErro('');
                    }}
                    className="block w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-surface-container-high file:text-on-surface hover:file:bg-primary-fixed border border-outline-variant rounded-xl p-2 bg-surface cursor-pointer"
                  />
                </div>

                {erro && (
                  <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                    {erro}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    disabled={processando}
                    onClick={() => handleJulgar(alvaraSelecionado.id, 'Aprovado')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" /> {processando ? 'Processando...' : 'Emitir / Aprovar Pedido'}
                  </button>
                  <button
                    type="button"
                    disabled={processando}
                    onClick={() => handleJulgar(alvaraSelecionado.id, 'Negado')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" /> {processando ? 'Processando...' : 'Negar Pedido'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-outline-variant pt-4 text-sm text-on-surface bg-surface p-4 rounded-xl space-y-2">
                <div>
                  <strong>Parecer Técnico:</strong> <span className="italic">"{alvaraSelecionado.resposta_analise || 'Sem parecer registrado.'}"</span>
                </div>
                {alvaraSelecionado.caminho_alvara_emitido && (
                  <div className="pt-2">
                    <a
                      href={montarUrlArquivo(alvaraSelecionado.caminho_alvara_emitido)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 rounded-lg border border-green-200 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" /> Visualizar Alvará Emitido
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAlvarasSection;

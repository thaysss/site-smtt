import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, ClipboardList,
  FilePenLine, FileText, Gavel, LoaderCircle, RefreshCw, ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminDateFilter from '../components/AdminDateFilter';
import api from '../services/api';
import { matchesDateFilter } from '../utils/dateFilters';

const parseDateBR = (value) => {
  if (!value) return null;
  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (!match) return null;
  const [, day, month, year, hour = '00', minute = '00'] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  return Number.isNaN(date.getTime()) ? null : date;
};

const isPending = (status) => {
  const normalized = String(status || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return !normalized || normalized.includes('analise') || normalized.includes('pendente');
};

const sameDay = (first, second) => first && second
  && first.getFullYear() === second.getFullYear()
  && first.getMonth() === second.getMonth()
  && first.getDate() === second.getDate();

const relativeTime = (date, fallback) => {
  if (!date) return fallback || 'Data não informada';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days <= 6) return `Há ${days} dia${days > 1 ? 's' : ''}`;
  return fallback || date.toLocaleDateString('pt-BR');
};

function AdminDashboard() {
  const navigate = useNavigate();
  const adminNome = localStorage.getItem('adminNome') || 'Servidor';
  const [data, setData] = useState({ infracoes: [], alvaras: [], alertas: [], recursos: [], eventos: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [periodMode, setPeriodMode] = useState('all');
  const [periodValue, setPeriodValue] = useState('');

  const loadDashboard = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setLoadError(false);

    const endpoints = [
      ['infracoes', '/admin/infracoes'],
      ['alvaras', '/admin/alvaras'],
      ['alertas', '/admin/alertas'],
      ['recursos', '/admin/recursos'],
      ['eventos', '/admin/eventos'],
    ];

    const results = await Promise.allSettled(endpoints.map(([, endpoint]) => api.get(endpoint)));
    const nextData = {};
    let hasFailure = false;

    results.forEach((result, index) => {
      const [key] = endpoints[index];
      if (result.status === 'fulfilled' && Array.isArray(result.value.data)) nextData[key] = result.value.data;
      else {
        nextData[key] = [];
        hasFailure = true;
      }
    });

    setData(nextData);
    setLoadError(hasFailure);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    api.defaults.headers.Authorization = `Bearer ${adminToken}`;
    void Promise.resolve().then(() => loadDashboard());
  }, [loadDashboard, navigate]);

  const openPanel = useCallback((tab) => {
    localStorage.setItem('adminMenuAtivo', tab);
    navigate('/admin/painel');
  }, [navigate]);

  const filteredData = useMemo(() => ({
    infracoes: data.infracoes.filter((item) => matchesDateFilter(item.data_hora_infracao, periodMode, periodValue)),
    alvaras: data.alvaras.filter((item) => matchesDateFilter(item.criado_em, periodMode, periodValue)),
    alertas: data.alertas.filter((item) => matchesDateFilter(item.data_inicio, periodMode, periodValue)),
    recursos: data.recursos.filter((item) => matchesDateFilter(item.criado_em, periodMode, periodValue)),
    eventos: data.eventos.filter((item) => matchesDateFilter(item.criado_em, periodMode, periodValue)),
  }), [data, periodMode, periodValue]);

  const metrics = useMemo(() => {
    const today = new Date();
    return {
      todayInfractions: filteredData.infracoes.filter((item) => sameDay(parseDateBR(item.data_hora_infracao), today)).length,
      pendingPermits: filteredData.alvaras.filter((item) => isPending(item.status)).length,
      activeAlerts: filteredData.alertas.filter((item) => String(item.status).toLowerCase() === 'ativo').length,
      pendingAppeals: filteredData.recursos.filter((item) => isPending(item.resultado_julgamento)).length,
      pendingEvents: filteredData.eventos.filter((item) => isPending(item.status)).length,
    };
  }, [filteredData]);

  const weeklyData = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return { date, label: formatter.format(date).replace('.', ''), value: 0 };
    });

    filteredData.infracoes.forEach((item) => {
      const date = parseDateBR(item.data_hora_infracao);
      const day = days.find((entry) => sameDay(entry.date, date));
      if (day) day.value += 1;
    });
    return days;
  }, [filteredData.infracoes]);

  const activities = useMemo(() => {
    const infractionActivities = filteredData.infracoes.map((item) => ({
      id: `inf-${item.id}`,
      kind: 'infraction',
      icon: Gavel,
      title: `Auto de Infração ${item.numero_ait ? `#${item.numero_ait}` : ''}`.trim(),
      description: `${item.veiculo?.placa || 'Placa não informada'} · ${item.local_cometimento || 'Local não informado'}`,
      date: parseDateBR(item.data_hora_infracao),
      originalDate: item.data_hora_infracao,
      action: () => openPanel('infracoes'),
    }));
    const permitActivities = filteredData.alvaras.map((item) => ({
      id: `alv-${item.id}`,
      kind: 'permit',
      icon: CheckCircle2,
      title: `Alvará ${item.numero_protocolo ? `#${item.numero_protocolo}` : 'recebido'}`,
      description: `${item.nome_solicitante || 'Requerente não informado'} · ${item.status || 'Em análise'}`,
      date: parseDateBR(item.criado_em),
      originalDate: item.criado_em,
      action: () => openPanel('alvaras'),
    }));
    const alertActivities = filteredData.alertas.map((item) => ({
      id: `alt-${item.id}`,
      kind: 'alert',
      icon: AlertTriangle,
      title: item.status === 'Ativo' ? 'Alerta de interdição ativo' : 'Alerta viário atualizado',
      description: `${item.rua_bairro || 'Local não informado'} · ${item.descricao || 'Sem descrição'}`,
      date: parseDateBR(item.data_inicio),
      originalDate: item.data_inicio,
      action: () => navigate('/admin/alertas'),
    }));

    return [...infractionActivities, ...permitActivities, ...alertActivities]
      .sort((first, second) => (second.date?.getTime() || 0) - (first.date?.getTime() || 0))
      .slice(0, 5);
  }, [filteredData.alertas, filteredData.alvaras, filteredData.infracoes, navigate, openPanel]);

  const maxWeeklyValue = Math.max(...weeklyData.map((day) => day.value), 1);

  return (
    <div className="admin-shell dashboard-shell flex h-screen">
      <AdminSidebar activeItem="dashboard" />

      <main className="dashboard-main flex-1 overflow-y-auto">
        <div className="dashboard-topbar">
          <div>
            <span>Ambiente administrativo</span>
            <strong>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())}</strong>
          </div>
          <button type="button" onClick={() => loadDashboard(true)} disabled={refreshing}>
            <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
            Atualizar dados
          </button>
        </div>

        <div className="dashboard-content">
          <header className="dashboard-welcome">
            <div>
              <p>Visão geral operacional</p>
              <h1>Bem-vindo(a), {adminNome.split(' ')[0]}</h1>
              <span>Acompanhe os serviços e as atividades da SMTT Propriá.</span>
            </div>
          </header>

          <AdminDateFilter
            mode={periodMode}
            value={periodValue}
            onModeChange={(mode) => { setPeriodMode(mode); setPeriodValue(''); }}
            onValueChange={setPeriodValue}
            onClear={() => { setPeriodMode('all'); setPeriodValue(''); }}
          />

          {loadError && (
            <div className="dashboard-warning" role="status">
              <ShieldAlert size={19} />
              Alguns indicadores não puderam ser atualizados. Os demais dados continuam disponíveis.
            </div>
          )}

          {loading ? (
            <div className="dashboard-loading"><LoaderCircle className="animate-spin" /> Carregando indicadores...</div>
          ) : (
            <>
              <section className="dashboard-overview" aria-label="Indicadores principais">
                <button type="button" className="dashboard-primary-action" onClick={() => navigate('/admin/infracoes')}>
                  <span><FilePenLine size={25} /></span>
                  <strong>Novo Auto de Infração</strong>
                  <small>Registrar nova ocorrência no sistema.</small>
                  <ArrowRight size={19} className="dashboard-action-arrow" />
                </button>

                <button type="button" className="dashboard-stat-card" onClick={() => openPanel('infracoes')}>
                  <div><span>Infrações hoje</span><Gavel size={22} /></div>
                  <strong>{metrics.todayInfractions.toString().padStart(2, '0')}</strong>
                  <small><TrendingUp size={15} /> {filteredData.infracoes.length} registros no período</small>
                </button>

                <button type="button" className="dashboard-stat-card" onClick={() => openPanel('alvaras')}>
                  <div><span>Alvarás pendentes</span><FileText size={22} /></div>
                  <strong>{metrics.pendingPermits.toString().padStart(2, '0')}</strong>
                  <small>Aguardando análise</small>
                </button>

                <button type="button" className="dashboard-stat-card" onClick={() => navigate('/admin/alertas')}>
                  <div><span>Alertas de interdição</span><AlertTriangle size={22} /></div>
                  <strong>{metrics.activeAlerts.toString().padStart(2, '0')}</strong>
                  <small>{metrics.activeAlerts === 1 ? 'Via com alerta ativo' : 'Vias com alerta ativo'}</small>
                </button>
              </section>

              <section className="dashboard-details">
                <article className="dashboard-activity-card">
                  <div className="dashboard-section-heading">
                    <div>
                      <p>Movimentações</p>
                      <h2>Atividades recentes</h2>
                    </div>
                    <button type="button" onClick={() => openPanel('infracoes')}>Ver todas <ArrowRight size={16} /></button>
                  </div>

                  {activities.length === 0 ? (
                    <div className="dashboard-empty"><ClipboardList size={28} /><span>Nenhuma atividade registrada.</span></div>
                  ) : (
                    <ul className="dashboard-activity-list">
                      {activities.map((activity) => {
                        const Icon = activity.icon;
                        return (
                          <li key={activity.id}>
                            <button type="button" onClick={activity.action}>
                              <span className={`dashboard-activity-icon is-${activity.kind}`}><Icon size={19} /></span>
                              <span className="dashboard-activity-copy">
                                <strong>{activity.title}</strong>
                                <small>{activity.description}</small>
                              </span>
                              <time>{relativeTime(activity.date, activity.originalDate)}</time>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </article>

                <aside className="dashboard-side-column">
                  <article className="dashboard-pending-card">
                    <div>
                      <p>Fila de trabalho</p>
                      <h2>Pendências operacionais</h2>
                    </div>
                    <button type="button" onClick={() => openPanel('recursos')}>
                      <span><Gavel size={18} /> Recursos</span><strong>{metrics.pendingAppeals}</strong>
                    </button>
                    <button type="button" onClick={() => openPanel('eventos')}>
                      <span><CalendarClock size={18} /> Eventos</span><strong>{metrics.pendingEvents}</strong>
                    </button>
                    <button type="button" onClick={() => openPanel('alvaras')}>
                      <span><FileText size={18} /> Alvarás</span><strong>{metrics.pendingPermits}</strong>
                    </button>
                  </article>

                  <article className="dashboard-chart-card">
                    <div className="dashboard-section-heading">
                      <div><p>Últimos 7 dias</p><h2>Ocorrências semanais</h2></div>
                    </div>
                    <div className="dashboard-bar-chart" aria-label="Gráfico de infrações registradas nos últimos sete dias">
                      {weeklyData.map((day) => (
                        <div key={day.date.toISOString()} className="dashboard-bar-item">
                          <span>{day.value}</span>
                          <div><i style={{ height: `${Math.max((day.value / maxWeeklyValue) * 100, day.value ? 12 : 3)}%` }} /></div>
                          <small>{day.label}</small>
                        </div>
                      ))}
                    </div>
                  </article>
                </aside>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;

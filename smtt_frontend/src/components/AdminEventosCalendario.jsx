import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, MapPin } from 'lucide-react';
import './AdminEventosCalendario.css';

const chaveData = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dataEvento = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s|$)/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return chaveData(date) === match[0].slice(0, 10) ? date : null;
};
const tom = (status) => status === 'Aprovado' ? 'approved' : status === 'Negado' ? 'denied' : 'pending';

export default function AdminEventosCalendario({ eventos, onAbrir }) {
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dia, setDia] = useState(() => chaveData(new Date()));
  const grupos = new Map();
  let semData = 0;
  eventos.forEach((evento) => {
    const date = dataEvento(evento.data_evento);
    if (!date) { semData += 1; return; }
    const key = chaveData(date);
    grupos.set(key, [...(grupos.get(key) || []), evento]);
  });
  const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1 - mes.getDay());
  const dias = Array.from({ length: 42 }, (_, index) => new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + index));
  const selecionados = [...(grupos.get(dia) || [])].sort((a, b) => String(a.data_evento).localeCompare(String(b.data_evento)));
  const totalMes = eventos.filter((evento) => {
    const date = dataEvento(evento.data_evento);
    return date && date.getMonth() === mes.getMonth() && date.getFullYear() === mes.getFullYear();
  }).length;
  function mudarMes(delta) {
    const next = new Date(mes.getFullYear(), mes.getMonth() + delta, 1);
    setMes(next);
    setDia(chaveData(next));
  }
  return <section className="event-calendar" aria-label="Calendário de eventos">
    <header className="event-calendar-header">
      <div><h2><CalendarDays size={20} /> Calendário de eventos</h2><p>{totalMes} {totalMes === 1 ? 'evento no mês' : 'eventos no mês'} · Conforme os filtros acima</p></div>
      <div className="event-calendar-navigation">
        <button type="button" onClick={() => { const today = new Date(); setMes(new Date(today.getFullYear(), today.getMonth(), 1)); setDia(chaveData(today)); }}>Hoje</button>
        <button type="button" aria-label="Mês anterior" onClick={() => mudarMes(-1)}><ChevronLeft size={18} /></button>
        <strong aria-live="polite">{mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>
        <button type="button" aria-label="Próximo mês" onClick={() => mudarMes(1)}><ChevronRight size={18} /></button>
      </div>
    </header>
    <div className="event-calendar-legend"><span className="pending">Em análise / aguardando</span><span className="approved">Aprovado</span><span className="denied">Negado</span></div>
    <div className="event-calendar-grid">
      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label) => <div className="event-calendar-weekday" key={label}>{label}</div>)}
      {dias.map((date) => {
        const key = chaveData(date);
        const items = grupos.get(key) || [];
        return <button type="button" key={key} aria-pressed={dia === key} aria-current={key === chaveData(new Date()) ? 'date' : undefined}
          aria-label={`${date.toLocaleDateString('pt-BR')}, ${items.length} eventos`}
          className={`event-calendar-day ${date.getMonth() !== mes.getMonth() ? 'outside' : ''} ${dia === key ? 'selected' : ''}`}
          onClick={() => { setDia(key); setMes(new Date(date.getFullYear(), date.getMonth(), 1)); }}>
          <span className="event-calendar-number">{date.getDate()}</span>
          {items.slice(0, 2).map((evento) => <span key={evento.id} className={`event-calendar-chip ${tom(evento.status)}`} title={evento.local_evento || evento.numero_protocolo}>{evento.local_evento || evento.numero_protocolo}</span>)}
          {items.length > 2 && <small>+{items.length - 2} eventos</small>}
          {items.length > 0 && <span className="event-calendar-mobile-count">{items.length}</span>}
        </button>;
      })}
    </div>
    <div className="event-calendar-agenda" aria-live="polite">
      <h3>Agenda de {new Date(`${dia}T12:00:00`).toLocaleDateString('pt-BR')} <span>({selecionados.length})</span></h3>
      {!selecionados.length && <p>Nenhum evento para este dia com os filtros aplicados.</p>}
      {selecionados.map((evento) => <button type="button" className="event-calendar-agenda-item" key={evento.id} onClick={() => onAbrir(evento)}>
        <span><strong>{String(evento.data_evento).slice(11, 16) || 'Sem horário'} · {evento.numero_protocolo}</strong><span><MapPin size={14} /> {evento.local_evento || 'Local não informado'}</span><small>{evento.nome_solicitante}</small></span>
        <span className={`event-calendar-chip ${tom(evento.status)}`}>{evento.status}</span><ChevronRight size={18} />
      </button>)}
    </div>
    {semData > 0 && <p className="event-calendar-note">{semData} solicitações com data ausente ou fora do formato reconhecido. Consulte a lista abaixo para revisar os dados.</p>}
  </section>;
}

import { useState } from 'react';
import AdminEventosCalendario from './AdminEventosCalendario';

export default function GuardaEventos({ eventos }) {
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('Todos');
  const [selecionado, setSelecionado] = useState(null);
  const filtrados = eventos.filter((evento) =>
    (status === 'Todos' || evento.status === status) &&
    [evento.numero_protocolo, evento.local_evento, evento.descricao].some((valor) =>
      String(valor || '').toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))));

  return <div className="eventos-consulta">
    <header className="eventos-page-header"><div><h1>Calendário de eventos</h1><p>Consulte os eventos cadastrados. Acesso somente para visualização.</p></div></header>
    <section className="eventos-filter-card" aria-label="Filtros de eventos">
      <div className="eventos-filter-grid">
        <div className="eventos-field"><label htmlFor="guarda-busca">Buscar evento</label><input id="guarda-busca" placeholder="Protocolo, local ou descrição" value={busca} onChange={(event) => setBusca(event.target.value)} /></div>
        <div className="eventos-field"><label htmlFor="guarda-status">Situação</label><select id="guarda-status" value={status} onChange={(event) => setStatus(event.target.value)}><option>Todos</option>{[...new Set(eventos.map((evento) => evento.status).filter(Boolean))].map((valor) => <option key={valor}>{valor}</option>)}</select></div>
        <button type="button" className="eventos-clear-button" onClick={() => { setBusca(''); setStatus('Todos'); }}>Limpar filtros</button>
      </div>
    </section>
    <AdminEventosCalendario eventos={filtrados} onAbrir={setSelecionado} somenteConsulta />
    <section className="eventos-results-card"><h2>Eventos ({filtrados.length})</h2>
      {filtrados.map((evento) => <p key={evento.id}><button type="button" className="evento-table-action" onClick={() => setSelecionado(evento)}>{evento.numero_protocolo} · {evento.local_evento || 'Local não informado'} · {evento.status}</button></p>)}
    </section>
    {selecionado && <div className="evento-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelecionado(null); }} onKeyDown={(event) => { if (event.key === 'Escape') setSelecionado(null); }}>
      <section className="evento-modal" role="dialog" aria-modal="true" aria-labelledby="guarda-evento-titulo">
        <header className="evento-modal-header"><h2 id="guarda-evento-titulo">{selecionado.numero_protocolo}</h2><button type="button" autoFocus onClick={() => setSelecionado(null)}>Fechar</button></header>
        <div className="evento-modal-body"><dl className="evento-modal-grid">
          <div><dt>Data e horário</dt><dd>{selecionado.data_evento?.replace(/^(\d{4})-(\d{2})-(\d{2})[T ]?/, '$3/$2/$1 ') || 'Não informados'}</dd></div>
          <div><dt>Local e vias</dt><dd>{selecionado.local_evento || 'Não informado'}</dd></div>
          <div><dt>Situação</dt><dd>{selecionado.status}</dd></div>
        </dl><div className="evento-modal-description"><span>Descrição</span><p>{selecionado.descricao || 'Não informada'}</p></div></div>
      </section>
    </div>}
  </div>;
}

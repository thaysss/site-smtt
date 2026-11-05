import { useState } from 'react';
import api from '../services/api';
import AdminEventosCalendario from './AdminEventosCalendario';

const urlArquivo = (caminho) => {
  if (!caminho) return '';
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return `${api.defaults.baseURL?.replace(/\/api\/?$/, '') || ''}${caminho.startsWith('/') ? '' : '/'}${caminho}`;
};

const documentoVisivel = (valor) => {
  if (!valor) return 'Não informado';
  return String(valor).replace(/\D/g, '').length === 14 ? valor : '***.***.***-**';
};

export default function GuardaEventos({ eventos }) {
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('Todos');
  const [selecionado, setSelecionado] = useState(null);
  const filtrados = eventos.filter((evento) =>
    (status === 'Todos' || evento.status === status) &&
    [evento.numero_protocolo, evento.nome_solicitante, evento.local_evento, evento.descricao].some((valor) =>
      String(valor || '').toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))));

  return <div className="eventos-consulta">
    <header className="eventos-page-header"><div><h1>Calendário de eventos</h1><p>Consulte os eventos cadastrados. Acesso somente para visualização.</p></div></header>
    <section className="eventos-filter-card" aria-label="Filtros de eventos">
      <div className="eventos-filter-grid">
        <div className="eventos-field"><label htmlFor="guarda-busca">Buscar evento</label><input id="guarda-busca" placeholder="Protocolo, solicitante, local ou descrição" value={busca} onChange={(event) => setBusca(event.target.value)} /></div>
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
        <div className="evento-modal-body"><h3>Dados do solicitante</h3><dl className="evento-modal-grid">
          <div><dt>Nome</dt><dd>{selecionado.nome_solicitante || 'Não informado'}</dd></div>
          <div><dt>CPF/CNPJ</dt><dd>{documentoVisivel(selecionado.cpf_cnpj)}</dd></div>
          <div><dt>Telefone</dt><dd>{selecionado.telefone || 'Não informado'}</dd></div>
          <div><dt>E-mail</dt><dd>{selecionado.email || 'Não informado'}</dd></div>
        </dl><h3>Dados do evento</h3><dl className="evento-modal-grid">
          <div><dt>Data e horário</dt><dd>{selecionado.data_evento?.replace(/^(\d{4})-(\d{2})-(\d{2})[T ]?/, '$3/$2/$1 ') || 'Não informados'}</dd></div>
          <div><dt>Local e vias</dt><dd>{selecionado.local_evento || 'Não informado'}</dd></div>
          <div><dt>Pedido enviado em</dt><dd>{selecionado.criado_em || 'Não informado'}</dd></div>
          <div><dt>Situação</dt><dd>{selecionado.status}</dd></div>
        </dl><div className="evento-modal-description"><span>Descrição</span><p>{selecionado.descricao || 'Não informada'}</p></div>
          {selecionado.caminho_arquivo && <a className="evento-modal-file" href={urlArquivo(selecionado.caminho_arquivo)} target="_blank" rel="noopener noreferrer">Visualizar requerimento e anexos</a>}
          <div className="evento-modal-description"><span>Parecer técnico</span><p>{selecionado.resposta_analise || 'Nenhum parecer registrado.'}</p></div>
          {selecionado.anexo_resposta && <a className="evento-modal-file" href={urlArquivo(selecionado.anexo_resposta)} target="_blank" rel="noopener noreferrer">Visualizar anexo da resposta</a>}
        </div>
      </section>
    </div>}
  </div>;
}

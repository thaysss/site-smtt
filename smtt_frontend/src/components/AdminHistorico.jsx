import { useEffect, useState } from 'react';
import api from '../services/api';

export function LinhaDoTempo({ itens }) {
  return <ol className="admin-timeline">
    {itens.map((item) => <li key={item.id}>
      <time dateTime={item.criado_em}>{new Date(item.criado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</time>
      <strong>{item.acao || ({ GET: 'Consulta', POST: 'Envio / criação', PUT: 'Atualização', DELETE: 'Exclusão' }[item.metodo] || item.metodo)}</strong>
      <p>{item.usuario_nome} <span>({item.perfil})</span></p>
      <p>{item.detalhes || item.recurso}</p>
      {!item.acao && <small>{item.status < 400 ? 'Sucesso' : 'Falha'} ({item.status})</small>}
    </li>)}
  </ol>;
}

export default function AdminHistorico({ entidade, registroId }) {
  const [dados, setDados] = useState({ itens: [], paginas: 0 });
  const [pagina, setPagina] = useState(1);
  const [atualizacao, setAtualizacao] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    api.get(`/auth/admin/historico/${entidade}/${registroId}`, { params: { pagina }, signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setDados(data); })
      .catch(() => { if (!controller.signal.aborted) setErro('Não foi possível carregar o histórico.'); })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [entidade, registroId, pagina, atualizacao]);
  const atualizar = () => { setErro(''); setCarregando(true); setAtualizacao((valor) => valor + 1); };
  return <section className="admin-history" aria-label="Histórico do registro">
    <div className="flex items-center justify-between gap-3"><h3 className="font-bold">Linha do tempo</h3><button type="button" disabled={carregando} onClick={atualizar}>Atualizar histórico</button></div>
    <p className="text-xs text-gray-500">Ações registradas a partir da implantação do histórico.</p>
    {carregando ? <p role="status">Carregando histórico...</p> : erro ? <p role="alert">{erro}</p> : dados.itens.length ? <LinhaDoTempo itens={dados.itens} /> : <p>Nenhuma ação registrada neste histórico.</p>}
    {dados.paginas > 1 && <div className="flex justify-between gap-3">
      <button type="button" disabled={carregando || pagina <= 1} onClick={() => { atualizar(); setPagina(pagina - 1); }}>Anterior</button>
      <span>Página {pagina} de {dados.paginas}</span>
      <button type="button" disabled={carregando || pagina >= dados.paginas} onClick={() => { atualizar(); setPagina(pagina + 1); }}>Próxima</button>
    </div>}
  </section>;
}

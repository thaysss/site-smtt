import { useEffect, useState } from 'react';
import { ListChecks } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../services/api';
import { LinhaDoTempo } from '../components/AdminHistorico';

function AdminLogs() {
  const [servidores, setServidores] = useState([]);
  const [erroServidores, setErroServidores] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api.get('/auth/admin/servidores', { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setServidores(data); })
      .catch(() => {
        if (!controller.signal.aborted) setErroServidores('Não foi possível carregar o filtro de servidores.');
      });
    return () => controller.abort();
  }, []);

  return <div className="admin-shell admin-users-shell">
    <AdminSidebar activeItem="logs" />
    <main className="admin-users-main">
      <header className="admin-users-header">
        <div className="admin-users-heading-icon"><ListChecks size={26} /></div>
        <div><span>Auditoria</span><h1>Logs de atividades</h1><p>Acompanhe os acessos e as operações dos usuários.</p></div>
      </header>
      {erroServidores && <div className="admin-users-message error" role="alert">{erroServidores}</div>}
      <AtividadesUsuarios servidores={servidores} />
    </main>
  </div>;
}

function AtividadesUsuarios({ servidores }) {
  const [usuarioId, setUsuarioId] = useState('');
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState({ itens: [], paginas: 0, total: 0 });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizacao, setAtualizacao] = useState(0);
  const [somenteAcoes, setSomenteAcoes] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    api.get('/auth/admin/atividades', { params: { pagina, usuario_id: usuarioId, somente_acoes: somenteAcoes ? '1' : '0' }, signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setDados(data); })
      .catch((error) => {
        if (!controller.signal.aborted) setErro(error.response?.data?.erro || 'Não foi possível carregar as atividades.');
      })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [pagina, usuarioId, atualizacao, somenteAcoes]);

  const prepararConsulta = () => { setCarregando(true); setErro(''); };
  return <section className="admin-users-list-card" aria-label="Logs de atividades dos usuários">
    <div className="admin-users-list-heading">
      <div><span>Atividades dos usuários</span><p>Histórico de acessos e operações registrados a partir da implantação dos logs.</p></div>
      <button type="button" disabled={carregando} onClick={() => { prepararConsulta(); setAtualizacao((valor) => valor + 1); }}>Atualizar</button>
    </div>
    <div className="admin-activity-controls">
      <label>Filtrar por servidor <select value={usuarioId} onChange={(event) => { prepararConsulta(); setUsuarioId(event.target.value); setPagina(1); }}>
        <option value="">Todos os usuários</option>
        {servidores.map((servidor) => <option key={servidor.id} value={servidor.id}>{servidor.nome}</option>)}
      </select></label>
      <span>{dados.total} registros</span>
      <label><input type="checkbox" checked={somenteAcoes} onChange={(event) => { prepararConsulta(); setSomenteAcoes(event.target.checked); setPagina(1); }} /> Somente ações nos registros</label>
    </div>
    {erro ? <p className="admin-users-message error" role="alert">{erro}</p> : carregando ? <p className="admin-users-empty" role="status">Carregando atividades...</p> : dados.itens.length === 0 ? <p className="admin-users-empty">Nenhuma atividade registrada.</p> :
      <LinhaDoTempo itens={dados.itens} />}
    <div className="admin-activity-controls">
      <button type="button" disabled={carregando || pagina <= 1} onClick={() => { prepararConsulta(); setPagina((valor) => valor - 1); }}>Anterior</button>
      <span>Página {pagina} de {Math.max(1, dados.paginas)}</span>
      <button type="button" disabled={carregando || pagina >= dados.paginas} onClick={() => { prepararConsulta(); setPagina((valor) => valor + 1); }}>Próxima</button>
    </div>
  </section>;
}

export default AdminLogs;

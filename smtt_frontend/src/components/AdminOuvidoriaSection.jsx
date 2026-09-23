import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Inbox, Mail, MessageSquareText, RefreshCw, Search } from 'lucide-react';
import api from '../services/api';

const STATUS = ['Todos', 'Recebida', 'Em atendimento', 'Respondida', 'Arquivada'];

function AdminOuvidoriaSection() {
  const [mensagens, setMensagens] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [aberta, setAberta] = useState(null);
  const [resposta, setResposta] = useState('');
  const [status, setStatus] = useState('Recebida');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const response = await api.get('/admin/ouvidoria');
      setMensagens(response.data);
    } catch (error) {
      setErro(error.response?.data?.erro || 'Não foi possível carregar as mensagens.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    api.get('/admin/ouvidoria')
      .then((response) => {
        if (ativo) setMensagens(response.data);
      })
      .catch((error) => {
        if (ativo) setErro(error.response?.data?.erro || 'Não foi possível carregar as mensagens.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => { ativo = false; };
  }, []);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return mensagens.filter((item) => {
      const correspondeStatus = filtroStatus === 'Todos' || item.status === filtroStatus;
      const texto = `${item.numero_protocolo} ${item.nome} ${item.email} ${item.assunto} ${item.mensagem}`.toLocaleLowerCase('pt-BR');
      return correspondeStatus && (!termo || texto.includes(termo));
    });
  }, [mensagens, busca, filtroStatus]);

  const selecionar = (item) => {
    if (aberta === item.id) {
      setAberta(null);
      return;
    }
    setAberta(item.id);
    setResposta(item.resposta || '');
    setStatus(item.status || 'Recebida');
    setAviso('');
    setErro('');
  };

  const salvar = async (id) => {
    setSalvando(true);
    setAviso('');
    setErro('');
    try {
      const response = await api.put(`/admin/ouvidoria/${id}`, { status, resposta });
      setMensagens((atuais) => atuais.map((item) => item.id === id ? response.data.registro : item));
      setAviso(response.data.mensagem);
    } catch (error) {
      setErro(error.response?.data?.erro || 'Não foi possível atualizar o atendimento.');
    } finally {
      setSalvando(false);
    }
  };

  const pendentes = mensagens.filter((item) => !['Respondida', 'Arquivada'].includes(item.status)).length;
  const respondidas = mensagens.filter((item) => item.status === 'Respondida').length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Atendimento ao cidadão</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Ouvidoria</h1>
          <p className="mt-1 text-sm text-gray-600">Mensagens enviadas pelo formulário Fale Conosco.</p>
        </div>
        <button type="button" onClick={carregar} disabled={carregando} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
          <RefreshCw size={16} className={carregando ? 'animate-spin' : ''} /> Atualizar
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5"><span className="text-xs font-bold uppercase text-gray-500">Total</span><strong className="mt-2 block text-3xl text-gray-900">{mensagens.length}</strong></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5"><span className="text-xs font-bold uppercase text-amber-700">Pendentes</span><strong className="mt-2 block text-3xl text-amber-800">{pendentes}</strong></div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"><span className="text-xs font-bold uppercase text-emerald-700">Respondidas</span><strong className="mt-2 block text-3xl text-emerald-800">{respondidas}</strong></div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input type="search" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar por protocolo, nome, e-mail ou mensagem" className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-primary-500 focus:outline-none" />
          </label>
          <select aria-label="Filtrar por status" value={filtroStatus} onChange={(event) => setFiltroStatus(event.target.value)} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none">
            {STATUS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </section>

      {erro && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro}</div>}
      {aviso && <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle size={18} />{aviso}</div>}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {carregando ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500"><RefreshCw size={18} className="animate-spin" /> Carregando mensagens...</div>
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center p-12 text-center text-gray-500"><Inbox size={40} className="mb-3 text-gray-300" /><strong>Nenhuma mensagem encontrada</strong><span className="mt-1 text-sm">Ajuste os filtros ou aguarde novos contatos.</span></div>
        ) : filtradas.map((item) => (
          <article key={item.id} className="border-b border-gray-100 last:border-b-0">
            <button type="button" onClick={() => selecionar(item)} className="grid w-full gap-3 p-5 text-left hover:bg-gray-50 md:grid-cols-[1fr_180px_150px_24px] md:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2"><MessageSquareText size={17} className="shrink-0 text-primary-600" /><strong className="truncate text-sm text-gray-900">{item.assunto} — {item.nome}</strong></div>
                <p className="mt-1 truncate text-sm text-gray-500">{item.mensagem}</p>
              </div>
              <span className="font-mono text-xs text-gray-600">{item.numero_protocolo}</span>
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'Respondida' ? 'bg-emerald-100 text-emerald-700' : item.status === 'Em atendimento' ? 'bg-blue-100 text-blue-700' : item.status === 'Arquivada' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
              {aberta === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {aberta === item.id && (
              <div className="border-t border-gray-100 bg-gray-50 p-5">
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600"><Mail size={16} /><a className="font-semibold text-primary-700 hover:underline" href={`mailto:${item.email}`}>{item.email}</a></div>
                    <p><strong className="text-gray-700">Recebida em:</strong> {item.criado_em}</p>
                    <div className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-gray-700">{item.mensagem}</div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">Status
                      <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-normal focus:border-primary-500 focus:outline-none">
                        {STATUS.slice(1).map((itemStatus) => <option key={itemStatus}>{itemStatus}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-semibold text-gray-700">Resposta ao cidadão
                      <textarea value={resposta} onChange={(event) => setResposta(event.target.value)} maxLength={4000} rows={6} placeholder="Registre aqui o retorno da SMTT..." className="mt-1.5 w-full resize-y rounded-lg border border-gray-200 bg-white p-3 font-normal focus:border-primary-500 focus:outline-none" />
                    </label>
                    <div className="flex items-center justify-between gap-3"><span className="text-xs text-gray-400">{resposta.length}/4000</span><button type="button" onClick={() => salvar(item.id)} disabled={salvando} className="rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-800 disabled:opacity-60">{salvando ? 'Salvando...' : 'Salvar atendimento'}</button></div>
                  </div>
                </div>
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}

export default AdminOuvidoriaSection;

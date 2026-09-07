import { useEffect, useRef, useState } from 'react';
import { Pencil, Trash2, X, Search } from 'lucide-react';
import api from '../services/api';

const inputClass = 'w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm';
const identify = (row) => row.nome_solicitante || row.numero_ait || row.numero_protocolo || row.placa || row.titulo || row.rua_bairro || row.tipo_recurso || `Registro #${row.id}`;
const errorMessage = (error) => error.response?.data?.erro || 'Não foi possível concluir a operação. Tente novamente.';

export default function AdminRegistrosSection({ target, onClose, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(target?.category || 'eventos');
  const [data, setData] = useState({ campos: [], registros: [] });
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [values, setValues] = useState({});
  const [files, setFiles] = useState({});
  const [removed, setRemoved] = useState([]);
  const [revision, setRevision] = useState(0);
  const dialog = useRef(null);
  const trigger = useRef(null);

  useEffect(() => {
    if (target) return;
    let active = true;
    api.get('/admin/registros').then(({ data: result }) => { if (active) setCategories(result); }).catch((err) => { if (active) setError(errorMessage(err)); });
    return () => { active = false; };
  }, [target]);

  useEffect(() => {
    let active = true;
    api.get(`/admin/registros/${category}`).then(({ data: result }) => {
      if (active) {
        setData(result); setLoading(false);
        if (target) {
          const row = result.registros.find((item) => item.id === target.id);
          if (!row) { setError('Registro não encontrado. Atualize a lista.'); return; }
          if (target.action === 'delete') setDeleting(row);
          else {
            setValues(Object.fromEntries(result.campos.map((field) => [field.nome, row[field.nome] ?? (field.tipo === 'checkbox' ? false : '')])));
            setEditing(row);
          }
        }
      }
    }).catch((err) => { if (active) { setError(errorMessage(err)); setLoading(false); } });
    return () => { active = false; };
  }, [category, revision, target]);

  useEffect(() => {
    if (!editing && !deleting) return;
    const previous = document.activeElement;
    dialog.current?.focus();
    return () => { previous?.focus(); };
  }, [editing, deleting]);

  const close = () => {
    if (busy) return;
    setEditing(null); setDeleting(null); setError(''); setFiles({}); setRemoved([]);
    onClose?.();
    trigger.current?.focus();
  };
  const modalKeys = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key !== 'Tab') return;
    const focusable = dialog.current.querySelectorAll('button:not(:disabled), input, textarea, select');
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      if (deleting) await api.delete(`/admin/registros/${category}/${deleting.id}`);
      else {
        const payload = new FormData();
        payload.append('dados', JSON.stringify({ ...values, _remover_anexos: removed }));
        Object.entries(files).forEach(([name, file]) => { if (file) payload.append(name, file); });
        await api.put(`/admin/registros/${category}/${editing.id}`, payload);
      }
      setFiles({}); setRemoved([]);
      if (target) { onSaved?.(); onClose?.(); return; }
      setMessage(deleting ? 'Registro excluído com sucesso.' : 'Alterações salvas com sucesso.');
      setEditing(null); setDeleting(null); setLoading(true); setData({ campos: [], registros: [] }); setRevision((n) => n + 1);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };
  const rows = data.registros.filter((row) => Object.values(row).some((value) => String(value ?? '').toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))));
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const currentPage = Math.min(page, pages);

  return <section className="space-y-6">
    {target && !editing && !deleting && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div role="dialog" aria-modal="true" aria-label="Carregar registro" className="bg-white rounded-2xl p-6 max-w-lg"><p role={error ? 'alert' : 'status'}>{error || 'Carregando registro...'}</p><button type="button" className="mt-4 px-4 py-2 border rounded-xl" onClick={onClose}>Fechar</button></div></div>}
    {!target && <>
    <div><h1 className="text-2xl font-bold text-gray-900">Editar e excluir registros</h1><p className="text-sm text-gray-600 mt-2">Gerencie solicitações, ações publicadas e registros administrativos. Nas solicitações, edite somente respostas, pareceres e anexos.</p></div>
    {message && <p role="status" className="p-3 rounded-xl bg-green-50 text-green-800">{message}</p>}
    {error && !editing && !deleting && <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-700">{error} <button type="button" className="underline" onClick={() => { setLoading(true); setError(''); setRevision((n) => n + 1); }}>Tentar novamente</button></div>}
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold">Categoria<select className={`${inputClass} mt-2`} value={category} onChange={(event) => { setCategory(event.target.value); setQuery(''); setPage(1); setLoading(true); setData({ campos: [], registros: [] }); setError(''); setMessage(''); }}>
        {categories.length ? categories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>) : <option value="eventos">Solicitações de eventos</option>}
      </select></label>
      <label className="text-sm font-semibold"><span className="flex gap-2 items-center"><Search size={16} />Buscar registros</span><input className={`${inputClass} mt-2`} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Nome, protocolo, placa ou conteúdo" /></label>
    </div>
    {loading ? <p role="status">Carregando registros...</p> : <>
      <p className="text-sm text-gray-500">{rows.length} registro(s) encontrado(s)</p>
      <div className="space-y-3">{rows.slice((currentPage - 1) * 10, currentPage * 10).map((row) => <article key={row.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0"><h2 className="font-bold text-gray-900 break-words">{identify(row)}</h2><p className="text-sm text-gray-500">#{row.id}{row.referencia ? ` · ${row.referencia}` : ''}{row.status ? ` · ${row.status}` : ''}</p></div>
        <div className="flex gap-3 shrink-0">
          <button type="button" aria-label={`Editar ${identify(row)}`} className="flex gap-2 items-center text-blue-700 font-semibold" onClick={(event) => { trigger.current = event.currentTarget; setError(''); setValues(Object.fromEntries(data.campos.map((field) => [field.nome, row[field.nome] ?? (field.tipo === 'checkbox' ? false : '')]))); setEditing(row); }}><Pencil size={16} />Editar</button>
          <button type="button" aria-label={`Excluir ${identify(row)}`} className="flex gap-2 items-center text-red-700 font-semibold" onClick={(event) => { trigger.current = event.currentTarget; setError(''); setDeleting(row); }}><Trash2 size={16} />Excluir</button>
        </div>
      </article>)}</div>
      {!rows.length && <p className="p-6 bg-white rounded-xl text-gray-500">Nenhum registro encontrado nesta categoria.</p>}
      {pages > 1 && <nav aria-label="Páginas de registros" className="flex items-center gap-4"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="disabled:opacity-40">Anterior</button><span>{currentPage} de {pages}</span><button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} className="disabled:opacity-40">Próxima</button></nav>}
    </>}
    </>}
    {(editing || deleting) && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="registro-dialog-title" ref={dialog} tabIndex={-1} onKeyDown={modalKeys} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between gap-4 items-start"><h2 id="registro-dialog-title" className="text-xl font-bold">{deleting ? 'Excluir' : 'Editar'}: {identify(deleting || editing)}</h2><button type="button" disabled={busy} onClick={close} aria-label="Fechar"><X size={22} /></button></div>
        {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
        <form onSubmit={submit} className="mt-5 space-y-4">
          {deleting ? <p>Confirma a exclusão permanente deste registro? Esta ação não pode ser desfeita.{['eventos', 'alvaras', 'recursos'].includes(category) ? ' O protocolo exclusivo desta solicitação e os registros de seus anexos também serão removidos.' : ''}</p> : <div className="grid sm:grid-cols-2 gap-4">{data.campos.map((field) => <label key={field.nome} className={`text-sm font-medium ${field.tipo === 'textarea' ? 'sm:col-span-2' : ''}`}>
            {field.label}{field.obrigatorio && field.tipo !== 'checkbox' ? ' *' : ''}
            {field.tipo === 'textarea' ? <textarea className={`${inputClass} mt-1`} rows={4} value={values[field.nome]} required={field.obrigatorio} maxLength={field.maxLength || undefined} onChange={(event) => setValues({ ...values, [field.nome]: event.target.value })} /> : <input className={field.tipo === 'checkbox' ? 'ml-3' : `${inputClass} mt-1`} type={field.tipo} value={field.tipo === 'checkbox' ? undefined : values[field.nome]} checked={field.tipo === 'checkbox' ? values[field.nome] : undefined} required={field.tipo !== 'checkbox' && field.obrigatorio} maxLength={field.maxLength || undefined} step={field.tipo === 'datetime-local' ? '1' : field.step} onChange={(event) => setValues({ ...values, [field.nome]: field.tipo === 'checkbox' ? event.target.checked : event.target.value })} />}
          </label>)}</div>}
          {editing && ['eventos', 'alvaras', 'recursos'].includes(category) && <section className="space-y-4">
            <p className="text-sm text-gray-600">Somente o parecer e os anexos podem ser alterados. Os dados da solicitação e a decisão registrada permanecem preservados.</p>
            <h3 className="font-bold">Anexos</h3>
            <p className="text-sm text-gray-600">PDF, PNG ou JPEG, até 10 MB por arquivo. Se não selecionar um novo arquivo, o anexo atual será mantido.</p>
            {(editing.anexos || []).map((attachment) => <div key={attachment.nome} className="border rounded-xl p-3 space-y-2">
              <strong className="block text-sm">{attachment.label}</strong>
              {attachment.url && <a className="block text-sm text-blue-700 underline" href={/^https?:\/\//i.test(attachment.url) ? attachment.url : `${api.defaults.baseURL?.replace(/\/api\/?$/, '') || ''}${attachment.url}`} target="_blank" rel="noopener noreferrer">Visualizar anexo atual</a>}
              <label className="block text-sm">{attachment.url ? 'Substituir arquivo' : 'Enviar arquivo'}<input type="file" accept=".pdf,.png,.jpg,.jpeg" disabled={busy || removed.includes(attachment.nome)} className="block w-full mt-1" onChange={(event) => { const file = event.target.files[0]; if (file && file.size > 10 * 1024 * 1024) { setError('O arquivo deve ter até 10 MB.'); event.target.value = ''; setFiles((current) => ({ ...current, [attachment.nome]: null })); return; } setError(''); setFiles((current) => ({ ...current, [attachment.nome]: file })); }} /></label>
              {attachment.url && attachment.removivel && <label className="flex gap-2 text-sm text-red-700"><input type="checkbox" disabled={busy || Boolean(files[attachment.nome])} checked={removed.includes(attachment.nome)} onChange={(event) => setRemoved((current) => event.target.checked ? [...current, attachment.nome] : current.filter((name) => name !== attachment.nome))} />Remover este anexo ao salvar</label>}
            </div>)}
          </section>}
          <div className="flex justify-end gap-3 pt-4"><button type="button" disabled={busy} onClick={close} className="px-4 py-2 border rounded-xl disabled:opacity-50">Cancelar</button><button type="submit" disabled={busy} className={`px-4 py-2 text-white rounded-xl disabled:opacity-50 ${deleting ? 'bg-red-700' : 'bg-blue-700'}`}>{busy ? 'Aguarde...' : deleting ? 'Confirmar exclusão' : 'Salvar alterações'}</button></div>
        </form>
      </div>
    </div>}
  </section>;
}

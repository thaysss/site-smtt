import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, XCircle } from 'lucide-react';
import api from '../services/api';

const campos = [
  ['nome_solicitante', 'Nome do responsável', 'text', 150],
  ['cpf_cnpj', 'CPF / CNPJ', 'text', 20],
  ['email', 'E-mail', 'email', 100],
  ['telefone', 'Telefone', 'tel', 20],
  ['data_evento', 'Data e horário do evento', 'datetime-local'],
  ['local_evento', 'Local e vias da interdição', 'text', 255],
];

function Formulario({ onClose, onSaved }) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const primeiroCampo = useRef(null);
  useEffect(() => { primeiroCampo.current?.focus(); }, []);
  async function salvar(event) {
    event.preventDefault();
    if (salvando) return;
    const dados = new FormData(event.currentTarget);
    const arquivo = dados.get('arquivo');
    if (arquivo.size > 10 * 1024 * 1024) {
      setErro('O requerimento deve ter no máximo 10 MB.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const { data } = await api.post('/admin/eventos', dados);
      onSaved(data);
      onClose();
    } catch (error) {
      setErro(error.response?.data?.erro || 'Não foi possível cadastrar o evento. Tente novamente.');
      setSalvando(false);
    }
  }
  return createPortal(
    <div className="evento-modal-backdrop" onKeyDown={(event) => {
      if (event.key === 'Escape' && !salvando) onClose();
      if (event.key === 'Tab') {
        const elementos = [...event.currentTarget.querySelectorAll('input, textarea, button')].filter((item) => !item.disabled);
        const primeiro = elementos[0];
        const ultimo = elementos[elementos.length - 1];
        if (event.shiftKey && document.activeElement === primeiro) { event.preventDefault(); ultimo?.focus(); }
        if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primeiro?.focus(); }
      }
    }}>
      <form className="evento-modal" role="dialog" aria-modal="true" aria-labelledby="novo-evento-titulo" onSubmit={salvar} aria-busy={salvando}>
        <header className="evento-modal-header">
          <div><span>Gestão de eventos</span><h2 id="novo-evento-titulo">Adicionar evento</h2></div>
          <button type="button" disabled={salvando} onClick={onClose} aria-label="Fechar cadastro"><XCircle size={22} /></button>
        </header>
        <div className="evento-modal-body">
          <p>Preencha os dados do evento. O cadastro receberá um protocolo e ficará em análise.</p>
          {erro && <p role="alert" className="novo-evento-erro">{erro}</p>}
          <fieldset disabled={salvando} className="novo-evento-campos">
            <div className="evento-modal-grid">
              {campos.map(([nome, label, tipo, limite], index) => <div className="eventos-field" key={nome}>
                <label htmlFor={`novo-${nome}`}>{label} *</label>
                <input ref={index === 0 ? primeiroCampo : undefined} id={`novo-${nome}`} name={nome} type={tipo} maxLength={limite} required />
              </div>)}
            </div>
            <div className="eventos-field"><label htmlFor="novo-descricao">Descrição</label><textarea id="novo-descricao" name="descricao" rows={3} maxLength={2000} /></div>
            <div className="eventos-field"><label htmlFor="novo-arquivo">Requerimento assinado *</label><input id="novo-arquivo" name="arquivo" type="file" accept=".pdf,.png,.jpg,.jpeg" required /><small>PDF, PNG ou JPEG de até 10 MB.</small></div>
          </fieldset>
        </div>
        <footer className="evento-modal-footer">
          <button type="button" className="evento-modal-cancel" disabled={salvando} onClick={onClose}>Cancelar</button>
          <button type="submit" className="evento-modal-approve" disabled={salvando}>{salvando ? 'Salvando…' : 'Cadastrar evento'}</button>
        </footer>
      </form>
    </div>, document.body);
}

export default function AdminNovoEvento({ onSaved }) {
  const [aberto, setAberto] = useState(false);
  const botao = useRef(null);
  return <>
    <button ref={botao} type="button" className="evento-modal-approve" onClick={() => setAberto(true)}><Plus size={18} /> Adicionar evento</button>
    {aberto && <Formulario onSaved={onSaved} onClose={() => { setAberto(false); botao.current?.focus(); }} />}
  </>;
}

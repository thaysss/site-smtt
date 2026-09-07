import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Trash2 } from 'lucide-react';
import AdminRegistrosSection from './AdminRegistrosSection';

export default function AdminRegistroActions({ category, id, onSaved }) {
  const [target, setTarget] = useState(null);
  const trigger = useRef(null);
  const open = (event, action) => {
    event.stopPropagation();
    trigger.current = event.currentTarget;
    setTarget({ category, id, action });
  };
  const close = () => {
    setTarget(null);
    trigger.current?.focus();
  };
  return <>
    <span className="admin-record-actions">
      <button type="button" className="admin-record-edit" aria-label={`Editar registro ${id}`} onClick={(event) => open(event, 'edit')}><Pencil size={14} />Editar</button>
      <button type="button" className="admin-record-delete" aria-label={`Excluir registro ${id}`} onClick={(event) => open(event, 'delete')}><Trash2 size={14} />Excluir</button>
    </span>
    {target && createPortal(<AdminRegistrosSection target={target} onClose={close} onSaved={onSaved} />, document.body)}
  </>;
}

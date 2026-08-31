import { CalendarDays, RotateCcw } from 'lucide-react';

function AdminDateFilter({ mode, value, onModeChange, onValueChange, onClear }) {
  const inputConfig = {
    day: { type: 'date', label: 'Data' },
    month: { type: 'month', label: 'Mês' },
    year: { type: 'number', label: 'Ano' },
  }[mode];

  return (
    <section className="admin-date-filter" aria-label="Filtro por período">
      <div className="admin-date-filter-title">
        <span><CalendarDays size={18} /></span>
        <div><strong>Filtrar por período</strong><small>Refine os registros da tela atual.</small></div>
      </div>
      <div className="admin-date-filter-controls">
        <label>
          <span>Período</span>
          <select value={mode} onChange={(event) => onModeChange(event.target.value)}>
            <option value="all">Todos os períodos</option>
            <option value="day">Dia específico</option>
            <option value="month">Mês</option>
            <option value="year">Ano</option>
          </select>
        </label>
        {inputConfig && (
          <label>
            <span>{inputConfig.label}</span>
            <input
              type={inputConfig.type}
              value={value}
              min={mode === 'year' ? '2000' : undefined}
              max={mode === 'year' ? '2100' : undefined}
              placeholder={mode === 'year' ? 'Ex: 2026' : undefined}
              onChange={(event) => onValueChange(event.target.value)}
            />
          </label>
        )}
        {mode !== 'all' && (
          <button type="button" onClick={onClear}><RotateCcw size={16} /> Limpar período</button>
        )}
      </div>
    </section>
  );
}

export default AdminDateFilter;

import { CalendarDays, RotateCcw } from 'lucide-react';

function AdminDateFilter({ mode, value, onModeChange, onValueChange, onClear }) {
  const inputConfig = {
    day: { type: 'date', label: 'Data' },
    month: { type: 'month', label: 'Mês' },
    year: { type: 'number', label: 'Ano' },
  }[mode];

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4" aria-label="Filtro por período">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <CalendarDays size={20} />
        </div>
        <div>
          <strong className="block text-sm font-bold text-gray-900 leading-tight">Filtrar por período</strong>
          <small className="block text-xs text-gray-500 mt-0.5 font-normal">Refine os registros da tela atual.</small>
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-start sm:justify-end gap-3">
        <label className="flex flex-col min-w-[170px]">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">PERÍODO</span>
          <select
            value={mode}
            onChange={(event) => onModeChange(event.target.value)}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg bg-white text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
          >
            <option value="all">Todos os períodos</option>
            <option value="day">Dia específico</option>
            <option value="month">Mês</option>
            <option value="year">Ano</option>
          </select>
        </label>
        {inputConfig && (
          <label className="flex flex-col min-w-[140px]">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{inputConfig.label.toUpperCase()}</span>
            <input
              type={inputConfig.type}
              value={value}
              min={mode === 'year' ? '2000' : undefined}
              max={mode === 'year' ? '2100' : undefined}
              placeholder={mode === 'year' ? 'Ex: 2026' : undefined}
              onChange={(event) => onValueChange(event.target.value)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg bg-white text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </label>
        )}
        {mode !== 'all' && (
          <button
            type="button"
            onClick={onClear}
            className="h-10 px-3 border border-gray-300 rounded-lg bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} /> Limpar período
          </button>
        )}
      </div>
    </section>
  );
}

export default AdminDateFilter;

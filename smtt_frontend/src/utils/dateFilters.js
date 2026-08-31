export const parseAdministrativeDate = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  const brazilian = text.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (brazilian) {
    const [, day, month, year, hour = '00', minute = '00'] = brazilian;
    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const [, year, month, day] = iso;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

export const matchesDateFilter = (dateValue, mode, filterValue) => {
  if (mode === 'all' || !filterValue) return true;
  const date = parseAdministrativeDate(dateValue);
  if (!date) return false;
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (mode === 'day') return `${year}-${month}-${day}` === filterValue;
  if (mode === 'month') return `${year}-${month}` === filterValue;
  if (mode === 'year') return year === String(filterValue);
  return true;
};

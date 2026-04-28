/**
 * Parsuje datę z backendu.
 * Jeśli backend zwraca UTC bez 'Z' (np. "2024-01-15T10:00:00"),
 * dodajemy 'Z' żeby JS traktował to jako UTC, a nie czas lokalny.
 */
const parseBackendDate = (value?: string | Date): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  let str = value.trim();

  // Jeśli string nie ma timezone (brak Z, +00:00, -05:00 itp.),
  // zakładamy że to UTC i doklejamy 'Z'
  if (!/[Zz]|[+-]\d{2}:?\d{2}$/.test(str)) {
    str += 'Z';
  }

  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
};

export const formatToPolishTime = (value?: string | Date) => {
  const date = parseBackendDate(value);

  if (!date) return { date: '-', time: '' };

  const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Europe/Warsaw',
  });

  const timeFormatter = new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Warsaw',
  });

  return {
    date: dateFormatter.format(date),
    time: timeFormatter.format(date),
  };
};

export const formatDate = formatToPolishTime;
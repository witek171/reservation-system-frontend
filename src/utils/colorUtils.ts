/**
 * Generates a consistent pastel color for a given eventTypeId
 * Uses a seed-based approach to ensure the same ID always gets the same color
 */
export const getEventTypeColor = (eventTypeId: string): {
  bg: string;
  text: string;
  border: string;
  light: string;
} => {
  const colors = [
    { bg: 'bg-blue-200', text: 'text-blue-900', border: 'border-blue-300', light: 'dark:bg-blue-500 dark:text-white dark:border-blue-400' },
    { bg: 'bg-rose-200', text: 'text-rose-900', border: 'border-rose-300', light: 'dark:bg-rose-500 dark:text-white dark:border-rose-400' },
    { bg: 'bg-green-200', text: 'text-green-900', border: 'border-green-300', light: 'dark:bg-green-600 dark:text-white dark:border-green-500' },
    { bg: 'bg-purple-200', text: 'text-purple-900', border: 'border-purple-300', light: 'dark:bg-purple-500 dark:text-white dark:border-purple-400' },
    { bg: 'bg-teal-200', text: 'text-teal-900', border: 'border-teal-300', light: 'dark:bg-teal-600 dark:text-white dark:border-teal-500' },
    { bg: 'bg-orange-200', text: 'text-orange-900', border: 'border-orange-300', light: 'dark:bg-orange-500 dark:text-white dark:border-orange-400' },
    { bg: 'bg-sky-200', text: 'text-sky-900', border: 'border-sky-300', light: 'dark:bg-sky-500 dark:text-white dark:border-sky-400' },
    { bg: 'bg-pink-200', text: 'text-pink-900', border: 'border-pink-300', light: 'dark:bg-pink-500 dark:text-white dark:border-pink-400' },
    { bg: 'bg-emerald-200', text: 'text-emerald-900', border: 'border-emerald-300', light: 'dark:bg-emerald-600 dark:text-white dark:border-emerald-500' },
    { bg: 'bg-indigo-200', text: 'text-indigo-900', border: 'border-indigo-300', light: 'dark:bg-indigo-500 dark:text-white dark:border-indigo-400' },
    { bg: 'bg-cyan-200', text: 'text-cyan-900', border: 'border-cyan-300', light: 'dark:bg-cyan-600 dark:text-white dark:border-cyan-500' },
    { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-300', light: 'dark:bg-red-500 dark:text-white dark:border-red-400' },
    { bg: 'bg-violet-200', text: 'text-violet-900', border: 'border-violet-300', light: 'dark:bg-violet-500 dark:text-white dark:border-violet-400' },
    { bg: 'bg-lime-200', text: 'text-lime-900', border: 'border-lime-300', light: 'dark:bg-lime-600 dark:text-white dark:border-lime-500' },
    { bg: 'bg-fuchsia-200', text: 'text-fuchsia-900', border: 'border-fuchsia-300', light: 'dark:bg-fuchsia-500 dark:text-white dark:border-fuchsia-400' },
    { bg: 'bg-amber-200', text: 'text-amber-900', border: 'border-amber-300', light: 'dark:bg-amber-500 dark:text-white dark:border-amber-400' },
    { bg: 'bg-slate-200', text: 'text-slate-900', border: 'border-slate-300', light: 'dark:bg-slate-500 dark:text-white dark:border-slate-400' },
    { bg: 'bg-yellow-200', text: 'text-yellow-900', border: 'border-yellow-300', light: 'dark:bg-yellow-500 dark:text-white dark:border-yellow-400' },
  ];

  let hash = 0;
  for (let i = 0; i < eventTypeId.length; i++) {
    const char = eventTypeId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};

export const getEventTypeColorCSS = (eventTypeId: string): string => {
  const color = getEventTypeColor(eventTypeId);
  return `${color.bg} ${color.light} ${color.text}`;
};

export const getEventTypeColorBorder = (eventTypeId: string): string => {
  const color = getEventTypeColor(eventTypeId);
  return color.border;
};

export const getEventTypeColorBg = (eventTypeId: string): string => {
  const color = getEventTypeColor(eventTypeId);
  return color.bg;
};

export const getEventTypeColorText = (eventTypeId: string): string => {
  const color = getEventTypeColor(eventTypeId);
  return color.text;
};


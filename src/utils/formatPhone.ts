export const formatPhone = (phone?: string): string => {
  if (!phone) return '-';
  const clean = phone.replace(/[^\d+]/g, '');
  if (clean.startsWith('+') && clean.length > 3) {
    const prefix = clean.slice(0, 3);
    const rest = clean.slice(3);
    return `${prefix} ${rest.replace(/(\d{3})(?=\d)/g, '$1 ')}`;
  }
  return clean.replace(/(\d{3})(?=\d)/g, '$1 ');
};


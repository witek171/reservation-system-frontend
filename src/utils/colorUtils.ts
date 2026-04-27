export interface EventColor {
  bg: string;
  text: string;
  border: string;
  dot: string;
  borderClass: string;
}

const PALETTE: EventColor[] = [
  {
    bg: 'bg-[#d6e4fb]', // niebieski
    text: 'text-[#1c3272]',
    border: '#6f95de',
    dot: 'bg-[#345bd1]',
    borderClass: 'border border-[#6f95de]',
  },
  {
    bg: 'bg-[#d4efe3]', // zielony
    text: 'text-[#174735]',
    border: '#5dbf97',
    dot: 'bg-[#279265]',
    borderClass: 'border border-[#5dbf97]',
  },
  {
    bg: 'bg-[#e2dcfb]', // fiolet
    text: 'text-[#372a75]',
    border: '#8f82de',
    dot: 'bg-[#523fd1]',
    borderClass: 'border border-[#8f82de]',
  },
  {
    bg: 'bg-[#f8ebc2]', // amber
    text: 'text-[#5a4612]',
    border: '#d9b94f',
    dot: 'bg-[#b88f1f]',
    borderClass: 'border border-[#d9b94f]',
  },
  {
    bg: 'bg-[#f4d6de]', // róż
    text: 'text-[#571f31]',
    border: '#d97f96',
    dot: 'bg-[#b83f61]',
    borderClass: 'border border-[#d97f96]',
  },
  {
    bg: 'bg-[#d2edf0]', // teal
    text: 'text-[#174649]',
    border: '#5fc0c6',
    dot: 'bg-[#278f98]',
    borderClass: 'border border-[#5fc0c6]',
  },
  {
    bg: 'bg-[#e9daf2]', // śliwkowy
    text: 'text-[#432552]',
    border: '#b77fd1',
    dot: 'bg-[#7f3fa8]',
    borderClass: 'border border-[#b77fd1]',
  },
  {
    bg: 'bg-[#f8e1d2]', // pomarańcz
    text: 'text-[#5a2f14]',
    border: '#d9966a',
    dot: 'bg-[#b85c22]',
    borderClass: 'border border-[#d9966a]',
  },
  {
    bg: 'bg-[#d9e5ee]', // blue-grey
    text: 'text-[#263845]',
    border: '#7f9fb5',
    dot: 'bg-[#446a85]',
    borderClass: 'border border-[#7f9fb5]',
  },
  {
    bg: 'bg-[#eaf2c8]', // oliwkowy
    text: 'text-[#424f17]',
    border: '#a9c94f',
    dot: 'bg-[#6e8f1f]',
    borderClass: 'border border-[#a9c94f]',
  },
  {
    bg: 'bg-[#f2d3cc]', // ceglasty
    text: 'text-[#571f17]',
    border: '#d97a6a',
    dot: 'bg-[#b83f2f]',
    borderClass: 'border border-[#d97a6a]',
  },
  {
    bg: 'bg-[#d9def6]', // denim
    text: 'text-[#253252]',
    border: '#7f91d6',
    dot: 'bg-[#3f57b0]',
    borderClass: 'border border-[#7f91d6]',
  },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export const getEventTypeColor = (eventTypeId: string): EventColor => {
  if (!eventTypeId) return PALETTE[0];
  return PALETTE[hashString(eventTypeId) % PALETTE.length];
};

export const getEventTypeColorCSS = (eventTypeId: string): string => {
  const c = getEventTypeColor(eventTypeId);
  return `${c.bg} ${c.text}`;
};
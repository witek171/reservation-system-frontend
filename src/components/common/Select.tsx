import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Types ─── */
export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  dropUp?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
}

/* ─── Hook: detect mobile ─── */
const MOBILE_BREAKPOINT = 768; // md breakpoint

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    // Initial check
    setIsMobile(mql.matches);

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
};

/* ─── Native Select (mobile) ─── */
const NativeSelect = ({
                        options,
                        value,
                        onChange,
                        placeholder,
                        className = '',
                        disabled,
                        id,
                        name,
                      }: Omit<SelectProps, 'dropUp'>) => {
  const hasValue = options.some((o) => String(o.value) === String(value));

  return (
    <div className={`relative ${className}`}>
      <select
        id={id}
        name={name}
        disabled={disabled}
        value={hasValue ? String(value) : ''}
        onChange={(e) => {
          const selectedOption = options.find((o) => String(o.value) === e.target.value);
          if (selectedOption) onChange(selectedOption.value);
        }}
        className={`
          w-full appearance-none rounded-xl border border-outline-variant
          bg-surface px-4 py-2.5 pr-10
          font-body-sm text-body-sm
          transition-all
          focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
          hover:border-outline
          disabled:opacity-50 disabled:cursor-not-allowed
          ${hasValue ? 'text-on-surface' : 'text-outline'}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom chevron icon */}
      <span
        className="
          pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
          material-symbols-outlined text-[22px] text-on-surface-variant
        "
      >
        expand_more
      </span>
    </div>
  );
};

/* ─── Custom Select (desktop) ─── */
const CustomSelectDesktop = ({
                               options,
                               value,
                               onChange,
                               placeholder,
                               className = '',
                               dropUp = false,
                               disabled,
                             }: SelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [shouldDropUp, setShouldDropUp] = useState(dropUp);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const selected = options.find((o) => String(o.value) === String(value));

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Decide drop direction based on available space
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const listHeight = Math.min(options.length * 44 + 12, 224);

    if (spaceBelow < listHeight && spaceAbove > spaceBelow) {
      setShouldDropUp(true);
    } else {
      setShouldDropUp(dropUp);
    }
  }, [open, options.length, dropUp]);

  // Scroll active option into view when opened
  useEffect(() => {
    if (!open || !listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-active="true"]');
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });

    // Set initial focused index to selected item
    const selectedIdx = options.findIndex((o) => String(o.value) === String(value));
    setFocusedIndex(selectedIdx >= 0 ? selectedIdx : 0);
  }, [open, options, value]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!open) {
            setOpen(true);
          } else if (focusedIndex >= 0 && focusedIndex < options.length) {
            onChange(options[focusedIndex].value);
            setOpen(false);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!open) {
            setOpen(true);
          } else {
            setFocusedIndex((prev) =>
              prev < options.length - 1 ? prev + 1 : prev
            );
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!open) {
            setOpen(true);
          } else {
            setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          btnRef.current?.focus();
          break;
        case 'Tab':
          setOpen(false);
          break;
      }
    },
    [disabled, open, focusedIndex, options, onChange]
  );

  // Scroll focused option into view
  useEffect(() => {
    if (!open || !listRef.current || focusedIndex < 0) return;
    const items = listRef.current.querySelectorAll('[role="option"]');
    items[focusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [open, focusedIndex]);

  return (
    <div ref={ref} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((p) => !p);
        }}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`
          flex w-full items-center justify-between rounded-xl border border-outline-variant
          bg-surface px-4 py-2.5 text-left transition-all
          focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
          hover:border-outline
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span
          className={`font-body-sm text-body-sm truncate ${
            selected ? 'text-on-surface' : 'text-outline'
          }`}
        >
          {selected?.label ?? placeholder ?? '—'}
        </span>
        <span
          className={`
            material-symbols-outlined ml-3 mr-0.5 text-[22px]
            text-on-surface-variant transition-transform duration-200
            ${open ? 'rotate-180' : ''}
          `}
        >
          expand_more
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className={`
            absolute z-[100] w-full max-h-56 overflow-y-auto
            rounded-xl border border-surface-variant
            bg-surface-container-lowest shadow-lg py-1.5
            ${shouldDropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}
          `}
        >
          {options.map((opt, index) => {
            const isActive = String(opt.value) === String(value);
            const isFocused = index === focusedIndex;
            return (
              <li key={opt.value} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  data-active={isActive}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    btnRef.current?.focus();
                  }}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`
                    flex w-full items-center gap-3 px-4 py-2.5 text-left
                    font-body-sm text-body-sm transition-colors
                    ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : isFocused
                        ? 'bg-surface-container-low text-on-surface'
                        : 'text-on-surface hover:bg-surface-container-low'
                  }
                  `}
                >
                  {isActive && (
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      check
                    </span>
                  )}
                  {!isActive && <span className="w-[18px]" />}
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

/* ─── Main Select component ─── */
const Select = (props: SelectProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <NativeSelect {...props} />;
  }

  return <CustomSelectDesktop {...props} />;
};

export default Select;
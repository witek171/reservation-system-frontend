import { useState, useEffect } from 'react';
import { useI18n } from '../../context/I18nContext.tsx';
import { IconClose, IconSearch } from './Icons.tsx';

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  debounceMs?: number;
  maxLength?: number;
  loading?: boolean;
  resultCount?: number | null;
  resultLabel?: string;
  className?: string;
}

const SearchBar = ({
                     value = '',
                     onChange,
                     onClear,
                     placeholder,
                     debounceMs = 300,
                     maxLength = 100,
                     loading = false,
                     resultCount = null,
                     resultLabel: _resultLabel,
                     className = '',
                   }: SearchBarProps) => {
  const { t } = useI18n();
  const [inputValue, setInputValue] = useState(value);

  const placehold = placeholder ?? t('search.placeholder');
  const resultLabelKey = resultCount === 1 ? 'search.results' : 'search.resultsPlural';

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedInput = inputValue.trim();
      const trimmedValue = value.trim();
      if (trimmedInput !== trimmedValue) onChange?.(trimmedInput);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [inputValue, value, onChange, debounceMs]);

  const handleClear = () => {
    setInputValue('');
    onClear?.();
  };

  const showResultCount = resultCount !== null && value.trim() !== '' && !loading;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline">
          <IconSearch className="h-full w-full" />
        </span>

        <input
          type="text"
          className="w-full rounded-lg border border-outline-variant bg-surface py-2.5 pl-10 pr-10 font-body-sm text-body-sm text-on-surface placeholder:text-outline shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder={placehold}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          maxLength={maxLength}
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-outline transition-colors hover:bg-surface-container-low hover:text-on-surface"
            title={t('common.clearSearch')}
          >
            <IconClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
          {t('search.loading')}
        </div>
      )}

      {showResultCount && resultCount !== null && (
        <span className="block font-body-sm text-body-sm text-on-surface-variant">
          {t(resultLabelKey, { count: resultCount })} {t('search.for')} &quot;{value}&quot;
        </span>
      )}
    </div>
  );
};

export default SearchBar;
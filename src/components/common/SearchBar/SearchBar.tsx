import { useState, useEffect } from 'react';
import { useI18n } from '../../../context/I18nContext';
import { IconClose, IconSearch } from '../Icons/Icons';

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
  resultLabel,
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
    <div className="space-y-1">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400">
          <IconSearch className="h-full w-full" />
        </span>
        <input
          type="text"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 py-2.5 pl-10 pr-10 text-zinc-900 placeholder-zinc-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-primary-500 dark:focus:ring-primary-500/20"
          placeholder={placehold}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          maxLength={maxLength}
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300 transition-colors"
            title={t('common.clearSearch')}
          >
            <IconClose className="h-4 w-4" />
          </button>
        )}
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-transparent dark:border-zinc-600" />
          {t('search.loading')}
        </div>
      )}
      {showResultCount && resultCount !== null && (
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {t(resultLabelKey, { count: resultCount })} {t('search.for')} &quot;{value}&quot;
        </span>
      )}
    </div>
  );
};

export default SearchBar;

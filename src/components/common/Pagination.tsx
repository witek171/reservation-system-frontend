import { useI18n } from '../../context/I18nContext.tsx';

interface PaginationProps {
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  maxVisiblePages?: number;
  showInfo?: boolean;
  infoTemplate?: string;
}

const Pagination = ({
  currentPage = 0,
  totalPages = 1,
  totalCount = 0,
  pageSize = 10,
  onPageChange,
  maxVisiblePages = 5,
  showInfo = true,
  infoTemplate,
}: PaginationProps) => {
  const { t } = useI18n();
  if (totalCount === 0) return null;

  const getDisplayRange = () => {
    const start = currentPage * pageSize + 1;
    const end = Math.min((currentPage + 1) * pageSize, totalCount);
    return { start, end };
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    let start = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages - 1, start + maxVisiblePages - 1);
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(0, end - maxVisiblePages + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages && newPage !== currentPage) {
      onPageChange?.(newPage);
    }
  };

  const { start, end } = getDisplayRange();
  const pageNumbers = getPageNumbers();
  const template = infoTemplate ?? t('pagination.showing');
  const formatInfo = () =>
    template.replace('{start}', String(start)).replace('{end}', String(end)).replace('{total}', String(totalCount));

  const btn =
    'min-w-[2.25rem] h-9 px-2 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors';
  const activeBtn = 'bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-200 border border-primary-200/50 dark:border-primary-500/30';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
      {showInfo && (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">{formatInfo()}</div>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={btn}
          onClick={() => handlePageChange(0)}
          disabled={currentPage === 0}
          title={t('pagination.first')}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="11 17 6 12 11 7" />
            <polyline points="18 17 13 12 18 7" />
          </svg>
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
          title={t('pagination.prev')}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="mx-1 flex items-center gap-0.5">
          {pageNumbers[0] > 0 && (
            <>
              <button type="button" className={btn} onClick={() => handlePageChange(0)}>1</button>
              {pageNumbers[0] > 1 && <span className="px-1 text-zinc-400">…</span>}
            </>
          )}
          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              className={`${btn} ${currentPage === pageNum ? activeBtn : ''}`}
              onClick={() => handlePageChange(pageNum)}
            >
              {pageNum + 1}
            </button>
          ))}
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 2 && <span className="px-1 text-zinc-400">…</span>}
              <button type="button" className={btn} onClick={() => handlePageChange(totalPages - 1)}>
                {totalPages}
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          className={btn}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          title={t('pagination.next')}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => handlePageChange(totalPages - 1)}
          disabled={currentPage >= totalPages - 1}
          title={t('pagination.last')}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
        </button>
      </div>
      {showInfo && <div className="w-20" />}
    </div>
  );
};

export default Pagination;

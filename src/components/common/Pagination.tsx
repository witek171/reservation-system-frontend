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

  const safeTotalPages = Math.max(totalPages, 1);

  const getDisplayRange = () => {
    const start = currentPage * pageSize + 1;
    const end = Math.min((currentPage + 1) * pageSize, totalCount);
    return { start, end };
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    let start = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(safeTotalPages - 1, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(0, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < safeTotalPages && newPage !== currentPage) {
      onPageChange?.(newPage);
    }
  };

  const { start, end } = getDisplayRange();
  const pageNumbers = getPageNumbers();
  const template = infoTemplate ?? t('pagination.showing');

  const formatInfo = () =>
    template
      .replace('{start}', String(start))
      .replace('{end}', String(end))
      .replace('{total}', String(totalCount));

  const baseBtn =
    'h-10 min-w-10 px-3 inline-flex items-center justify-center rounded-xl border text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-40 disabled:cursor-not-allowed';

  const navBtn =
    `${baseBtn} border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline hover:bg-surface hover:text-on-surface`;

  const pageBtn =
    `${baseBtn} border-outline-variant bg-surface text-on-surface-variant hover:border-outline hover:bg-surface-container-low hover:text-on-surface`;

  const activePageBtn =
    `${baseBtn} border-primary bg-primary text-on-primary shadow-sm hover:bg-primary hover:text-on-primary`;

  return (
    <div className="border-t border-surface-variant bg-surface-bright px-4 py-4">
      {/* Mobile */}
      <div className="sm:hidden space-y-3">
        {showInfo && (
          <div className="text-center font-body-sm text-body-sm text-on-surface-variant">
            {formatInfo()}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-2xl border border-surface-variant bg-surface-container-low p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            className={`${navBtn} shrink-0`}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            title={t('pagination.prev')}
            aria-label={t('pagination.prev')}
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          <div className="flex-1 rounded-xl border border-outline-variant bg-surface px-3 py-2 text-center">
            <div className="text-xs text-outline">Strona</div>
            <div className="font-label-bold text-label-bold text-on-surface">
              {currentPage + 1} / {safeTotalPages}
            </div>
          </div>

          <button
            type="button"
            className={`${navBtn} shrink-0`}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= safeTotalPages - 1}
            title={t('pagination.next')}
            aria-label={t('pagination.next')}
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        {showInfo ? (
          <div className="font-body-sm text-body-sm text-on-surface-variant">
            {formatInfo()}
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1 rounded-2xl border border-surface-variant bg-surface-container-low px-2 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            className={navBtn}
            onClick={() => handlePageChange(0)}
            disabled={currentPage === 0}
            title={t('pagination.first')}
            aria-label={t('pagination.first')}
          >
            <span className="material-symbols-outlined text-[18px]">first_page</span>
          </button>

          <button
            type="button"
            className={navBtn}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            title={t('pagination.prev')}
            aria-label={t('pagination.prev')}
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          <div className="flex items-center gap-1">
            {pageNumbers[0] > 0 && (
              <>
                <button
                  type="button"
                  className={pageBtn}
                  onClick={() => handlePageChange(0)}
                >
                  1
                </button>

                {pageNumbers[0] > 1 && (
                  <span className="px-1.5 text-outline select-none">…</span>
                )}
              </>
            )}

            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={currentPage === pageNum ? activePageBtn : pageBtn}
                onClick={() => handlePageChange(pageNum)}
                aria-current={currentPage === pageNum ? 'page' : undefined}
              >
                {pageNum + 1}
              </button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < safeTotalPages - 1 && (
              <>
                {pageNumbers[pageNumbers.length - 1] < safeTotalPages - 2 && (
                  <span className="px-1.5 text-outline select-none">…</span>
                )}

                <button
                  type="button"
                  className={pageBtn}
                  onClick={() => handlePageChange(safeTotalPages - 1)}
                >
                  {safeTotalPages}
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className={navBtn}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= safeTotalPages - 1}
            title={t('pagination.next')}
            aria-label={t('pagination.next')}
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>

          <button
            type="button"
            className={navBtn}
            onClick={() => handlePageChange(safeTotalPages - 1)}
            disabled={currentPage >= safeTotalPages - 1}
            title={t('pagination.last')}
            aria-label={t('pagination.last')}
          >
            <span className="material-symbols-outlined text-[18px]">last_page</span>
          </button>
        </div>

        {showInfo ? <div className="hidden lg:block w-20" /> : <div />}
      </div>
    </div>
  );
};

export default Pagination;
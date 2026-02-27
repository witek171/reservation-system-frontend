import { useI18n } from '../../../context/I18nContext';
import { IconClose } from '../Icons/Icons';

interface ErrorModalProps {
  error: string | { message?: string } | null;
  onClose: () => void;
  title?: string;
}

const ErrorModal = ({ error, onClose, title }: ErrorModalProps) => {
  const { t } = useI18n();
  if (!error) return null;

  const errorMessage =
    typeof error === 'string' ? error : (error as { message?: string })?.message ?? JSON.stringify(error);
  const modalTitle = title ?? t('error.title');

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 dark:bg-black/60"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-soft-dark"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{modalTitle}</h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{errorMessage}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <IconClose className="w-4 h-4" />
          {t('common.close')}
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;

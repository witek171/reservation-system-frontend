import { useI18n } from '../../context/I18nContext.tsx';
import { IconClose } from './Icons.tsx';

interface ErrorModalProps {
  error: string | { message?: string } | null;
  onClose: () => void;
  title?: string;
}

const ErrorModal = ({ error, onClose, title }: ErrorModalProps) => {
  const { t } = useI18n();
  if (!error) return null;

  const errorMessage =
    typeof error === 'string'
      ? error
      : (error as { message?: string })?.message ?? JSON.stringify(error);
  const modalTitle = title ?? t('error.title');

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl border border-surface-container-highest bg-surface-container-lowest p-lg shadow-sm"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="font-h3 text-h3 text-error">{modalTitle}</h3>
        <p className="mt-xs font-body-md text-body-md text-on-surface-variant">{errorMessage}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-md flex h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-surface-variant bg-surface font-label-bold text-label-bold text-on-surface hover:bg-surface-container-low active:scale-[0.98] transition-all"
        >
          <IconClose className="h-4 w-4" />
          {t('common.close')}
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;
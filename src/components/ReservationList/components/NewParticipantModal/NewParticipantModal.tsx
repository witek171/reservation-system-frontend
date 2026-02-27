import React, { useState } from 'react';
import { useI18n } from '../../../../context/I18nContext';
import { IconClose } from '../../../common/Icons/Icons';

const formInput =
  'w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/20';

interface NewParticipantFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gdprConsent: boolean;
}

interface NewParticipantModalProps {
  onClose: () => void;
  onSubmit: (data: NewParticipantFormData) => Promise<void>;
}

const NewParticipantModal: React.FC<NewParticipantModalProps> = ({ onClose, onSubmit }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<NewParticipantFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gdprConsent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 dark:bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-700 rounded-t-2xl bg-white dark:bg-zinc-900">
          <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 m-0">
            {t('reservations.addNewParticipant')}
          </h4>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          {error && (
            <div className="flex items-center justify-between gap-2 py-3 px-4 mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              <span>{error}</span>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition-colors"
                onClick={() => setError(null)}
              >
                {t('reservations.dismiss')}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('common.firstName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={formInput}
                  placeholder={t('common.firstName')}
                  value={formData.firstName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                  maxLength={40}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('common.lastName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={formInput}
                  placeholder={t('common.lastName')}
                  value={formData.lastName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                  maxLength={40}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('common.email')} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className={formInput}
                placeholder={t('common.email')}
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('common.phone')} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                className={formInput}
                placeholder={t('common.phone')}
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>

            <label className="flex items-center gap-2 px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer bg-white dark:bg-zinc-900">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-zinc-300 text-primary-500 focus:ring-primary-400"
                checked={formData.gdprConsent}
                onChange={(e) => setFormData((prev) => ({ ...prev, gdprConsent: e.target.checked }))}
                required
              />
              <span className="text-sm text-zinc-800 dark:text-zinc-200 cursor-pointer">
                {t('participants.gdprConsent')} <span className="text-red-500">*</span>
              </span>
            </label>

            <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700 mt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-500/25 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200 dark:hover:bg-primary-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? t('reservations.creating') : t('reservations.createAndSelect')}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                onClick={onClose}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewParticipantModal;

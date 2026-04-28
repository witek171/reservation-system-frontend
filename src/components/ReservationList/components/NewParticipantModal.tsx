import React, { useState } from 'react';
import { useI18n } from '../../../context/I18nContext.tsx';

const formInput =
  'w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all';

const closeBtnClass =
  'h-9 w-9 inline-flex items-center justify-center rounded-full text-outline hover:text-on-surface hover:bg-surface-variant transition-colors';

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
    // Brak ModalPortal! Renderowany inline w ReservationForm.
    // z-[10000] > z-[9999] create modalu = poprawne warstwowanie bez psucia scrolla.
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-surface-variant">
          <h3 className="font-h3 text-h3 text-on-surface">
            {t('reservations.addNewParticipant')}
          </h3>
          <button type="button" onClick={onClose} className={closeBtnClass} aria-label={t('common.close')}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-on-error-container">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
                  <span className="font-body-sm text-body-sm">{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-on-error-container/80 hover:text-on-error-container"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-body-sm text-body-sm text-on-surface">
                {t('common.firstName')} <span className="text-error">*</span>
              </label>
              <input type="text" className={formInput} placeholder={t('common.firstName')} value={formData.firstName} onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))} required maxLength={40} autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="font-body-sm text-body-sm text-on-surface">
                {t('common.lastName')} <span className="text-error">*</span>
              </label>
              <input type="text" className={formInput} placeholder={t('common.lastName')} value={formData.lastName} onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))} required maxLength={40} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-body-sm text-body-sm text-on-surface">
              {t('common.email')} <span className="text-error">*</span>
            </label>
            <input type="email" className={formInput} placeholder={t('common.email')} value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} required />
          </div>

          <div className="space-y-1.5">
            <label className="font-body-sm text-body-sm text-on-surface">
              {t('common.phone')} <span className="text-error">*</span>
            </label>
            <input type="tel" className={formInput} placeholder={t('common.phone')} value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} required />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-surface-variant bg-surface px-4 py-3 cursor-pointer">
            <input type="checkbox" className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20" checked={formData.gdprConsent} onChange={(e) => setFormData((p) => ({ ...p, gdprConsent: e.target.checked }))} required />
            <span className="font-body-sm text-body-sm text-on-surface">
              {t('participants.gdprConsent')} <span className="text-error">*</span>
            </span>
          </label>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-surface-variant">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-label-bold text-label-bold hover:bg-surface-container-low transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={submitting} className={`px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-bold text-label-bold hover:bg-primary-hover transition-colors inline-flex items-center justify-center gap-2 ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />}
              {submitting ? t('reservations.creating') : t('reservations.createAndSelect')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewParticipantModal;
import { useState, useEffect } from 'react';
import { companyApi } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../context/I18nContext.tsx';
import type { Company } from '../types/api.ts';
import ErrorModal from './common/ErrorModal.tsx';
import { formatPhone } from '../utils/formatPhone.ts';
import { formatToPolishTime } from '../utils/formatDate.ts';

interface CompanyData extends Company {
  taxCode?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  isParentNode?: boolean;
  isReception?: boolean;
  breakTimeStaff?: number;
  breakTimeParticipants?: number;
  createdAt?: string;
}

const inputClass =
  'w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all';

const CompanySettings = () => {
  const { t } = useI18n();
  const { selectedCompany, selectCompany, isManager } = useAuth();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [error, setError] = useState<string | { message?: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editingBreakTimes, setEditingBreakTimes] = useState(false);
  const [receptionLoading, setReceptionLoading] = useState(false);
  const [loading, setLoading] = useState(true);        // initial load only
  const [saving, setSaving] = useState(false);          // form submissions

  const [formData, setFormData] = useState({
    name: '',
    taxCode: '',
    street: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
  });

  const [breakTimesData, setBreakTimesData] = useState({
    breakTimeStaff: 0,
    breakTimeParticipants: 0,
  });

  const companyId = selectedCompany?.id;

  const fetchCompany = async (silent = false) => {
    if (!companyId) return;
    try {
      if (!silent) setLoading(true);
      setError(null);
      const response = await companyApi.getById(companyId);
      const data = response.data as CompanyData;
      setCompanyData(data);
      setFormData({
        name: data.name || '',
        taxCode: data.taxCode || '',
        street: data.street || '',
        city: data.city || '',
        postalCode: data.postalCode || '',
        phone: data.phone || '',
        email: data.email || '',
      });
      try {
        const breakRes = await companyApi.getBreakTimes(companyId);
        const bt = breakRes.data as {
          breakTimeStaff?: number;
          breakTimeParticipants?: number;
        };
        setBreakTimesData({
          breakTimeStaff: bt.breakTimeStaff ?? data.breakTimeStaff ?? 0,
          breakTimeParticipants:
            bt.breakTimeParticipants ?? data.breakTimeParticipants ?? 0,
        });
        setCompanyData((prev) =>
          prev
            ? {
              ...prev,
              breakTimeStaff: bt.breakTimeStaff ?? prev.breakTimeStaff,
              breakTimeParticipants:
                bt.breakTimeParticipants ?? prev.breakTimeParticipants,
            }
            : prev
        );
      } catch {
        setBreakTimesData({
          breakTimeStaff: data.breakTimeStaff ?? 0,
          breakTimeParticipants: data.breakTimeParticipants ?? 0,
        });
      }
    } catch (err: unknown) {
      const e = err as any;
      setError(e.response?.data?.message ?? e.response?.data ?? e.message ?? null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !selectedCompany) return;
    try {
      setSaving(true);
      setError(null);
      await companyApi.update(companyId, formData);
      await fetchCompany(true);          // silent — no spinner
      setEditing(false);
      selectCompany({ ...selectedCompany, ...formData });
    } catch (err: unknown) {
      const e = err as any;
      setError(e.response?.data?.message ?? e.response?.data ?? e.message ?? null);
    } finally {
      setSaving(false);
    }
  };

  const handleBreakTimesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    try {
      setSaving(true);
      setError(null);
      await companyApi.updateBreakTimes(companyId, {
        breakTimeStaff: Number(breakTimesData.breakTimeStaff),
        breakTimeParticipants: Number(breakTimesData.breakTimeParticipants),
      });
      await fetchCompany(true);          // silent — no spinner
      setEditingBreakTimes(false);
    } catch (err: unknown) {
      const e = err as any;
      setError(e.response?.data?.message ?? e.response?.data ?? e.message ?? null);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleToggleReception = async () => {
    if (!companyId || receptionLoading) return;
    const wasReception = companyData?.isReception;
    try {
      setReceptionLoading(true);
      setError(null);
      // Optimistic update
      setCompanyData((prev) => (prev ? { ...prev, isReception: !wasReception } : prev));
      if (wasReception) {
        await companyApi.unmarkAsReception(companyId);
      } else {
        await companyApi.markAsReception(companyId);
      }
    } catch (err: unknown) {
      const e = err as any;
      // Revert on error
      setCompanyData((prev) => (prev ? { ...prev, isReception: wasReception } : prev));
      setError(e.response?.data?.message ?? e.response?.data ?? e.message ?? null);
    } finally {
      setReceptionLoading(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-8">
        <div className="flex items-center justify-center gap-3 text-on-surface-variant">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
          {t('settings.loading')}
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-8">
        <p className="text-center font-body-md text-body-md text-on-surface-variant">
          {t('settings.noCompanyData')}
        </p>
      </div>
    );
  }

  // ── Helpers ──
  const { date: createdDate, time: createdTime } = formatToPolishTime(companyData.createdAt);

  const Field = ({
                   label,
                   value,
                   wide,
                 }: {
    label: string;
    value?: string | null;
    wide?: boolean;
  }) => (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <span className="font-body-sm text-body-sm text-on-surface-variant">{label}</span>
      <p className="font-body-md text-body-md text-on-surface mt-0.5">{value || '-'}</p>
    </div>
  );

  // ── Render ──
  return (
    <div className="space-y-6">
      {error && <ErrorModal error={error} onClose={() => setError(null)} />}

      {/* Page header */}
      <div>
        <h1 className="font-h2 text-h2 text-on-surface">{t('settings.title')}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* ═══ Company details card ═══ */}
      <div className="w-full bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-surface-variant overflow-hidden">
        {/* Card header */}
        <div className="p-4 md:p-6 border-b border-surface-variant flex items-center justify-between gap-4 bg-surface-bright">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">business</span>
            <h2 className="font-h3 text-h3 text-on-surface">{t('settings.companyDetails')}</h2>
          </div>
          {!editing && isManager() && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2.5 font-label-bold text-label-bold text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              {t('common.edit')}
            </button>
          )}
        </div>

        {/* Card body */}
        <div className="p-4 md:p-6 space-y-6">
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                  {t('settings.companyName')} *
                </label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder={t('settings.companyName')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                    {t('settings.taxCode')} *
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder={t('settings.taxCode')}
                    value={formData.taxCode}
                    onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                    {t('common.email')} *
                  </label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="company@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                  {t('settings.street')} *
                </label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder={t('settings.street')}
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                    {t('settings.city')} *
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder={t('settings.city')}
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                    {t('settings.postalCode')} *
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="00-000"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                  {t('common.phone')} *
                </label>
                <input
                  type="tel"
                  className={inputClass}
                  placeholder="+48 000 000 000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary-hover text-on-primary font-label-bold text-label-bold py-3 px-6 rounded-lg shadow-sm transition-colors"
                >
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-6 py-3 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('settings.companyName')} value={companyData.name} />
              <Field label={t('settings.taxCode')} value={companyData.taxCode} />
              <Field label={t('common.email')} value={companyData.email} />
              <Field label={t('common.phone')} value={formatPhone(companyData.phone)} />
              <Field
                label={t('settings.address')}
                value={`${companyData.street}, ${companyData.postalCode} ${companyData.city}`}
                wide
              />
              <div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {t('settings.created')}
                </span>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <span className="font-body-md text-body-md text-on-surface">{createdDate}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {createdTime}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Reception mode toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-variant bg-surface-container-low p-4">
            <div>
              <p className="font-body-md text-body-md text-on-surface font-semibold">
                {t('settings.receptionMode')}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {companyData.isReception
                  ? t('settings.receptionOn')
                  : t('settings.receptionOff')}
              </p>
            </div>
            {isManager() && (
              <button
                type="button"
                disabled={receptionLoading}
                onClick={handleToggleReception}
                className={`rounded-lg border px-4 py-2.5 font-label-bold text-label-bold transition-colors flex items-center gap-2 ${
                  companyData.isReception
                    ? 'border-error text-error hover:bg-error-container'
                    : 'border-outline-variant text-on-surface hover:bg-surface-container'
                } ${receptionLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {receptionLoading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {companyData.isReception
                  ? t('settings.disable')
                  : t('settings.enable')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Break times card (manager only) ═══ */}
      {isManager() && (
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-surface-variant overflow-hidden">
          {/* Card header */}
          <div className="p-4 md:p-6 border-b border-surface-variant flex items-center justify-between gap-4 bg-surface-bright">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">schedule</span>
              <h2 className="font-h3 text-h3 text-on-surface">{t('settings.breakTimes')}</h2>
            </div>
            {!editingBreakTimes && (
              <button
                type="button"
                onClick={() => setEditingBreakTimes(true)}
                className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2.5 font-label-bold text-label-bold text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                {t('common.edit')}
              </button>
            )}
          </div>

          {/* Card body */}
          <div className="p-4 md:p-6">
            {editingBreakTimes ? (
              <form onSubmit={handleBreakTimesSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                      {t('settings.staffBreak')} *
                    </label>
                    <input
                      type="number"
                      className={inputClass}
                      min={0}
                      value={breakTimesData.breakTimeStaff}
                      onChange={(e) =>
                        setBreakTimesData({
                          ...breakTimesData,
                          breakTimeStaff: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                      {t('settings.participantBreak')} *
                    </label>
                    <input
                      type="number"
                      className={inputClass}
                      min={0}
                      value={breakTimesData.breakTimeParticipants}
                      onChange={(e) =>
                        setBreakTimesData({
                          ...breakTimesData,
                          breakTimeParticipants: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-primary hover:bg-primary-hover text-on-primary font-label-bold text-label-bold py-3 px-6 rounded-lg shadow-sm transition-colors"
                  >
                    {t('settings.saveBreakTimes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingBreakTimes(false)}
                    className="px-6 py-3 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Staff break tile */}
                <div className="rounded-xl border border-surface-variant bg-surface-container-low p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {t('settings.staffBreak')}
                    </p>
                    <p className="font-h3 text-h3 text-on-surface">
                      {companyData.breakTimeStaff ?? 0}{' '}
                      <span className="font-body-md text-body-md text-on-surface-variant">min</span>
                    </p>
                  </div>
                </div>

                {/* Participant break tile */}
                <div className="rounded-xl border border-surface-variant bg-surface-container-low p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">group</span>
                  </div>
                  <div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {t('settings.participantBreak')}
                    </p>
                    <p className="font-h3 text-h3 text-on-surface">
                      {companyData.breakTimeParticipants ?? 0}{' '}
                      <span className="font-body-md text-body-md text-on-surface-variant">min</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySettings;
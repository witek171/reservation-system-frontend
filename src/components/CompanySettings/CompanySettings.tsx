import { useState, useEffect } from 'react';
import { companyApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import type { Company } from '../../types/api';
import { IconBuilding, IconClock, IconEdit, IconClose } from '../common/Icons/Icons';

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

const formInput =
  'w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/20';

const CompanySettings = () => {
  const { t, locale } = useI18n();
  const { selectedCompany, selectCompany, isManager } = useAuth();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [editing, setEditing] = useState(false);
  const [editingBreakTimes, setEditingBreakTimes] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    taxCode: '',
    street: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
  });
  const [breakTimesData, setBreakTimesData] = useState({ breakTimeStaff: 0, breakTimeParticipants: 0 });

  const companyId = selectedCompany?.id;

  const fetchCompany = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
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
        const bt = breakRes.data as { breakTimeStaff?: number; breakTimeParticipants?: number };
        setBreakTimesData({
          breakTimeStaff: bt.breakTimeStaff ?? data.breakTimeStaff ?? 0,
          breakTimeParticipants: bt.breakTimeParticipants ?? data.breakTimeParticipants ?? 0,
        });
        setCompanyData((prev) => (prev ? { ...prev, breakTimeStaff: bt.breakTimeStaff ?? prev.breakTimeStaff, breakTimeParticipants: bt.breakTimeParticipants ?? prev.breakTimeParticipants } : prev));
      } catch {
        setBreakTimesData({
          breakTimeStaff: data.breakTimeStaff ?? 0,
          breakTimeParticipants: data.breakTimeParticipants ?? 0,
        });
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchCompany();
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !selectedCompany) return;
    try {
      setError(null);
      await companyApi.update(companyId, formData);
      await fetchCompany();
      setEditing(false);
      selectCompany({ ...selectedCompany, ...formData });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.response?.data ?? e.message);
    }
  };

  const handleBreakTimesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    try {
      setError(null);
      await companyApi.updateBreakTimes(companyId, {
        breakTimeStaff: Number(breakTimesData.breakTimeStaff),
        breakTimeParticipants: Number(breakTimesData.breakTimeParticipants),
      });
      await fetchCompany();
      setEditingBreakTimes(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message);
    }
  };

  const handleMarkAsReception = async () => {
    if (!companyId) return;
    try {
      await companyApi.markAsReception(companyId);
      await fetchCompany();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message);
    }
  };

  const handleUnmarkAsReception = async () => {
    if (!companyId) return;
    try {
      await companyApi.unmarkAsReception(companyId);
      await fetchCompany();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message);
    }
  };

  const formatDateTime = (dateString?: string) =>
    dateString
      ? new Date(dateString).toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '-';

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
        <div className="flex items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-transparent dark:border-zinc-600" />
          {t('settings.loading')}
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
        <p className="text-center text-zinc-500 dark:text-zinc-400">{t('settings.noCompanyData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            <IconBuilding className="w-5 h-5 text-primary-500 dark:text-primary-400" />
            {t('settings.companyDetails')}
          </h3>
          {!editing && isManager() && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              <IconEdit className="w-4 h-4" />
              {t('common.edit')}
            </button>
          )}
        </div>
        {error != null ? (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {String(error)}
          </div>
        ) : null}
        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.companyName')} *</label>
              <input type="text" className={formInput} placeholder={t('settings.companyName')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.taxCode')} *</label>
                <input type="text" className={formInput} placeholder={t('settings.taxCode')} value={formData.taxCode} onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('common.email')} *</label>
                <input type="email" className={formInput} placeholder="company@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.street')} *</label>
              <input type="text" className={formInput} placeholder={t('settings.street')} value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.city')} *</label>
                <input type="text" className={formInput} placeholder={t('settings.city')} value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.postalCode')} *</label>
                <input type="text" className={formInput} placeholder="00-000" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('common.phone')} *</label>
              <input type="tel" className={formInput} placeholder="+48 000 000 000" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-500/25 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200 dark:hover:bg-primary-500/30 transition-colors">
                {t('common.save')}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                <IconClose className="w-4 h-4" />
                {t('common.cancel')}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div><span className="text-sm text-zinc-500 dark:text-zinc-400">{t('settings.companyName')}</span><p className="font-medium text-zinc-900 dark:text-zinc-100">{companyData.name}</p></div>
            <div><span className="text-sm text-zinc-500 dark:text-zinc-400">{t('settings.taxCode')}</span><p className="text-zinc-900 dark:text-zinc-100">{companyData.taxCode}</p></div>
            <div><span className="text-sm text-zinc-500 dark:text-zinc-400">{t('common.email')}</span><p className="text-zinc-900 dark:text-zinc-100">{companyData.email}</p></div>
            <div><span className="text-sm text-zinc-500 dark:text-zinc-400">{t('common.phone')}</span><p className="text-zinc-900 dark:text-zinc-100">{companyData.phone}</p></div>
            <div className="sm:col-span-2"><span className="text-sm text-zinc-500 dark:text-zinc-400">{t('settings.address')}</span><p className="text-zinc-900 dark:text-zinc-100">{companyData.street}, {companyData.postalCode} {companyData.city}</p></div>
            <div><span className="text-sm text-zinc-500 dark:text-zinc-400">{t('settings.created')}</span><p className="text-zinc-900 dark:text-zinc-100">{formatDateTime(companyData.createdAt)}</p></div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <div>
            <h5 className="font-medium text-zinc-900 dark:text-zinc-100">{t('settings.receptionMode')}</h5>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {companyData.isReception ? t('settings.receptionOn') : t('settings.receptionOff')}
            </p>
          </div>
          {isManager() && (
            <button
              type="button"
              onClick={companyData.isReception ? handleUnmarkAsReception : handleMarkAsReception}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              {companyData.isReception ? t('settings.disable') : t('settings.enable')}
            </button>
          )}
        </div>
      </div>

      {isManager() && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              <IconClock className="w-5 h-5 text-primary-500 dark:text-primary-400" />
              {t('settings.breakTimes')}
            </h3>
            {!editingBreakTimes && (
              <button type="button" onClick={() => setEditingBreakTimes(true)} className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                <IconEdit className="w-4 h-4" />
                {t('common.edit')}
              </button>
            )}
          </div>
          {editingBreakTimes ? (
            <form onSubmit={handleBreakTimesSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.staffBreak')} *</label>
                  <input type="number" className={formInput} min={0} value={breakTimesData.breakTimeStaff} onChange={(e) => setBreakTimesData({ ...breakTimesData, breakTimeStaff: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.participantBreak')} *</label>
                  <input type="number" className={formInput} min={0} value={breakTimesData.breakTimeParticipants} onChange={(e) => setBreakTimesData({ ...breakTimesData, breakTimeParticipants: Number(e.target.value) })} required />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-500/25 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200 dark:hover:bg-primary-500/30 transition-colors">
                  {t('settings.saveBreakTimes')}
                </button>
                <button type="button" onClick={() => setEditingBreakTimes(false)} className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                  <IconClose className="w-4 h-4" />
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('settings.staffBreak')}</p>
                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{companyData.breakTimeStaff ?? 0} min</p>
              </div>
              <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('settings.participantBreak')}</p>
                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{companyData.breakTimeParticipants ?? 0} min</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanySettings;

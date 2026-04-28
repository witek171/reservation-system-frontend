import {useNavigate} from 'react-router-dom';
import {useI18n} from '../context/I18nContext';
import desktopPreview from '../assets/desktop-preview.png';
import mobilePreview from '../assets/mobile-preview.png';

export default function LandingPage() {
  const navigate = useNavigate();
  const {t} = useI18n();

  const handleDemo = () => {
    // Prepopulate login form with demo credentials
    navigate('/login', {state: {email: 'm@m.pl', password: 'demo'}});
  };

  return (
    <div className="bg-background min-h-screen flex flex-col overflow-x-clip">
      {/* Header */}
      <header
        className="w-full h-16 border-b border-surface-variant bg-surface-container-lowest/80 backdrop-blur-md fixed top-0 z-50">
        <div className="max-w-7xl mx-auto px-gutter h-full flex items-center justify-between">
          <div className="text-[26px] leading-none font-bold tracking-[-0.02em] text-on-surface select-none">
            Bookium
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-gutter py-xl md:py-[120px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-center">
            <div className="lg:col-span-4 flex flex-col gap-md">
              <h1 className="font-h1 text-h1 text-on-surface leading-tight">
                {t('landing.hero.title')}
              </h1>

              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
                {t('landing.hero.subtitle')}
              </p>

              <div className="pt-sm flex flex-col gap-sm sm:flex-row">
                <button
                  onClick={handleDemo}
                  className="inline-flex items-center justify-center bg-secondary text-on-secondary px-gutter py-sm rounded-full font-label-bold text-label-bold hover:bg-secondary/90 transition-colors w-auto shadow-[0_4px_14px_0_rgba(0,108,73,0.39)]"
                >
                  {t('landing.hero.demo')}
                  <span className="material-symbols-outlined ml-xs text-[18px]">
                    arrow_forward
                  </span>
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center border border-primary text-primary px-gutter py-sm rounded-full font-label-bold text-label-bold hover:bg-primary hover:text-on-primary transition-colors w-auto"
                >
                  {t('auth.signIn')}
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 relative">
              {/* Mobile / tablet */}
              <div className="relative lg:hidden pr-10 sm:pr-12 md:pr-14 pb-6 sm:pb-8">
                <div className="rounded-lg bg-white p-1 ring-1 ring-black/10">
                  <div className="aspect-[1904/937] w-full overflow-hidden rounded-md bg-surface-container-lowest">
                    <img
                      src={desktopPreview}
                      alt="Podgląd aplikacji na komputerze"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <img
                  src={mobilePreview}
                  alt="Podgląd aplikacji na telefonie"
                  className="absolute right-2 sm:right-3 md:right-4 -bottom-8 z-10 w-[18%] min-w-[72px] max-w-[100px] sm:w-[20%] sm:max-w-[130px] md:w-[22%] md:max-w-[165px] object-contain"
                />
              </div>

              {/* Desktop */}
              <div className="hidden lg:block relative pr-12 xl:pr-20 2xl:pr-24 pb-12">
                <div className="absolute inset-0 bg-primary-fixed-dim/20 blur-3xl rounded-[28px] scale-95"/>

                <div className="relative rounded-lg bg-white p-1.5 ring-1 ring-black/10">
                  <div className="aspect-[1904/937] w-full overflow-hidden rounded-md bg-surface-container-lowest">
                    <img
                      src={desktopPreview}
                      alt="Podgląd aplikacji na komputerze"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <img
                  src={mobilePreview}
                  alt="Podgląd aplikacji na telefonie"
                  className="absolute right-8 xl:right-10 -bottom-6 z-10 w-[19%] min-w-[150px] max-w-[220px] object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid Section */}
        <section className="bg-surface-container-low border-t border-surface-variant py-xl">
          <div className="max-w-7xl mx-auto px-gutter">
            <div className="flex flex-col items-center text-center mb-lg">
              <h2 className="font-h2 text-h2 text-on-surface mb-xs">
                Kluczowe Moduły
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                Skonfiguruj system pod własne potrzeby. Minimalistyczny interfejs
                redukuje zmęczenie poznawcze personelu.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
              {/* Feature 1: Grafik */}
              <div
                className="md:col-span-8 bg-surface-container-lowest rounded-xl p-lg border border-surface-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group overflow-hidden relative">
                <div
                  className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed-dim/20 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-110"/>

                <div className="relative z-10 flex flex-col h-full">
                  <div
                    className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed mb-md">
                    <span className="material-symbols-outlined text-[24px]">
                      calendar_view_week
                    </span>
                  </div>

                  <h3 className="font-h3 text-h3 text-on-surface mb-sm">
                    {t('landing.features.schedule')}
                  </h3>

                  <p className="font-body-md text-body-md text-on-surface-variant mb-lg max-w-md">
                    {t('landing.features.scheduleDesc')}
                  </p>
                </div>
              </div>

              {/* Feature 2: Zespół */}
              <div
                className="md:col-span-4 bg-surface-container-lowest rounded-xl p-lg border border-surface-variant shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div
                  className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface mb-md">
                  <span className="material-symbols-outlined text-[24px]">
                    groups
                  </span>
                </div>

                <h3 className="font-h3 text-h3 text-on-surface mb-sm">
                  {t('landing.features.team')}
                </h3>

                <p className="font-body-md text-body-md text-on-surface-variant">
                  {t('landing.features.teamDesc')}
                </p>
              </div>

              {/* Feature 3: Płatności */}
              <div
                className="md:col-span-12 bg-tertiary-container rounded-xl p-lg shadow-sm overflow-hidden relative flex items-center min-h-[200px]">
                <div className="absolute inset-0 bg-gradient-to-r from-tertiary-container to-tertiary-fixed-dim/40"/>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between w-full gap-md">
                  <div className="flex flex-col max-w-xl">
                    <div
                      className="w-12 h-12 rounded-lg bg-on-tertiary-container/10 flex items-center justify-center text-on-tertiary mb-md">
                      <span className="material-symbols-outlined text-[24px]">
                        notifications_active
                      </span>
                    </div>

                    <h3 className="font-h3 text-h3 text-on-tertiary mb-sm">
                      {t('landing.features.notifications')}
                    </h3>

                    <p className="font-body-md text-body-md text-tertiary-fixed-dim">
                      {t('landing.features.notificationsDesc')}
                    </p>
                  </div>

                  <div className="hidden md:flex gap-sm">
                    <div
                      className="w-16 h-16 rounded-full border border-tertiary-fixed/30 flex items-center justify-center text-tertiary-fixed opacity-50">
                      <span className="material-symbols-outlined">
                        sync_alt
                      </span>
                    </div>

                    <div
                      className="w-16 h-16 rounded-full border border-tertiary-fixed/30 flex items-center justify-center text-tertiary-fixed">
                      <span className="material-symbols-outlined">
                        verified_user
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-surface-variant py-md text-center">
        <div className="max-w-7xl mx-auto px-gutter">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t('landing.footer')}
          </p>
        </div>
      </footer>
    </div>
  );
}
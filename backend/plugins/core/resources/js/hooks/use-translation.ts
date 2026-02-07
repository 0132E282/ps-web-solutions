import { useTranslation as useI18nTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';

export function useTranslation() {
    const { t, i18n } = useI18nTranslation('common');

    const changeLanguage = (locale: string) => {
        i18n.changeLanguage(locale);
        
        // Reload page with ?locale=vi query parameter
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('locale', locale);
        
        router.get(
            currentUrl.pathname + currentUrl.search,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['locale', 'translations', 'availableLocales'],
            },
        );
    };

    return {
        t,
        locale: i18n.language,
        changeLanguage,
    };
}


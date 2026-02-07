import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

interface TranslationsData {
    [locale: string]: {
        [namespace: string]: Record<string, unknown>;
    };
}

const getInitialData = (): { props?: { translations?: Record<string, unknown>, locales?: string[], locale?: string } } | null => {
    if (typeof window === 'undefined') return null;
    const win = window as unknown as { __INERTIA_INITIAL_DATA__?: { props?: Record<string, unknown> } };
    if (win.__INERTIA_INITIAL_DATA__) return win.__INERTIA_INITIAL_DATA__ as { props?: { translations?: Record<string, unknown>, locales?: string[], locale?: string } };

    try {
        const pageElement = document.getElementById('app')?.getAttribute('data-page');
        return pageElement ? JSON.parse(pageElement) : null;
    } catch {
        return null;
    }
};

const getAvailableLocales = (): string[] => {
    const data = getInitialData()?.props;
    if (Array.isArray(data?.locales) && data.locales.length > 0) {
        return data.locales;
    }

    const translations = (data?.translations || {}) as Record<string, unknown>;
    const locales = Object.keys(translations).filter(k => translations[k] && typeof translations[k] === 'object');
    if (locales.length > 0) return locales;

    const browserLang = typeof navigator !== 'undefined' ? navigator.language?.split('-')[0] : null;
    return browserLang ? [browserLang] : [];
};

const getAvailableNamespaces = (translations: Record<string, unknown>, availableLocales: string[]): string[] => {
    const namespaces = new Set<string>();
    availableLocales.forEach((locale) => {
        const localeData = translations[locale] as Record<string, unknown> | undefined;
        if (localeData && typeof localeData === 'object') {
            Object.keys(localeData).forEach((ns) => {
                if (localeData[ns] && typeof localeData[ns] === 'object') namespaces.add(ns);
            });
        }
    });
    return Array.from(namespaces);
};

const getTranslationsFromInertia = (): TranslationsData => {
    const translations = (getInitialData()?.props?.translations || {}) as Record<string, unknown>;
    const availableLocales = getAvailableLocales();
    const availableNamespaces = getAvailableNamespaces(translations, availableLocales);
    const result: TranslationsData = {};

    availableLocales.forEach((locale) => {
        const localeData = translations[locale] as Record<string, unknown> | undefined;
        const localeResult: Record<string, unknown> = {};

        if (localeData && typeof localeData === 'object') {
            availableNamespaces.forEach((ns) => {
                localeResult[ns] = (localeData[ns] && typeof localeData[ns] === 'object') ? localeData[ns] : {};
            });
            Object.keys(localeData).forEach((ns) => {
                if (!localeResult[ns] && typeof localeData[ns] === 'object') {
                    localeResult[ns] = localeData[ns] as Record<string, unknown>;
                }
            });
        } else {
            availableNamespaces.forEach((ns) => {
                localeResult[ns] = {};
            });
        }

        result[locale] = localeResult as Record<string, Record<string, unknown>>;
    });

    return result;
};

const isValidLocale = (locale: string | null | undefined, locales: string[]): boolean => {
    return locale !== null && locale !== undefined && (locales.length === 0 || locales.includes(locale));
};

const getInitialLocale = (): string => {
    const locales = getAvailableLocales();

    if (typeof window !== 'undefined') {
        const queryLocale = new URLSearchParams(window.location.search).get('locale');
        if (isValidLocale(queryLocale, locales)) return queryLocale!;
    }

    const propsLocale = getInitialData()?.props?.locale;
    if (typeof propsLocale === 'string') return propsLocale;

    if (typeof document !== 'undefined') {
        const cookieLocale = document.cookie.split('; ').find(r => r.startsWith('locale='))?.split('=')[1];
        if (isValidLocale(cookieLocale, locales)) return cookieLocale!;
    }

    return locales[0] || (typeof navigator !== 'undefined' ? navigator.language?.split('-')[0] : null) || 'en';
};

const resources = getTranslationsFromInertia();
const initialLocale = getInitialLocale();
const locales = getAvailableLocales();

const getAvailableNamespacesFromResources = (): string[] => {
    const namespaces = new Set<string>();
    Object.keys(resources).forEach((locale) => {
        Object.keys(resources[locale] || {}).forEach((ns) => namespaces.add(ns));
    });
    return Array.from(namespaces).length > 0 ? Array.from(namespaces) : ['common'];
};

const namespaces = getAvailableNamespacesFromResources();
const defaultNamespace = namespaces.includes('common') ? 'common' : namespaces[0] || 'common';
const getFallbackLanguage = (): string => locales[0] || 'en';

export const tt = (key: string, options?: Record<string, unknown>): string => {
    try {
        if (key.startsWith('route.')) {
            const routeKey = key.replace('route.', '');
            const translation = i18n.t(`routes.${routeKey}`, {
                ns: 'common',
                ...options,
                returnObjects: false,
                defaultValue: key
            });
            if (typeof translation === 'string' && translation !== `routes.${routeKey}` && translation !== key) {
                return translation;
            }
        } else if (key.startsWith('common.')) {
            const commonKey = key.replace('common.', '');
            const translation = i18n.t(commonKey, {
                ns: 'common',
                ...options,
                returnObjects: false,
                defaultValue: key
            });
            if (typeof translation === 'string' && translation !== commonKey && translation !== key) {
                return translation;
            }
        } else if (key.startsWith('fields.')) {
            const fieldsKey = key.replace('fields.', '');
            const translation = i18n.t(fieldsKey, {
                ns: 'fields',
                ...options,
                returnObjects: false,
                defaultValue: key
            });
            if (typeof translation === 'string' && translation !== fieldsKey && translation !== key) {
                return translation;
            }
        } else {
            const translation = i18n.t(key, {
                ...options,
                returnObjects: false,
                defaultValue: key
            });
            if (typeof translation === 'string' && translation !== key) {
                return translation;
            }
        }
    } catch {
        // Silent fail
    }

    return key;
};

if (typeof window !== 'undefined') {
    (window as unknown as { tt: unknown }).tt = tt;
}

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        lng: initialLocale,
        fallbackLng: getFallbackLanguage(),
        supportedLngs: locales.length > 0 ? locales : undefined,
        defaultNS: defaultNamespace,
        ns: namespaces,
        keySeparator: '.',
        returnNull: false,
        returnEmptyString: false,
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['cookie', 'localStorage', 'navigator'],
            caches: ['cookie', 'localStorage'],
            lookupCookie: 'locale',
            cookieMinutes: 60 * 24 * 365,
        },
        react: {
            useSuspense: false,
        },
    });

if (typeof window !== 'undefined') {
    const addResourceBundle = (locale: string, namespace: string, data: unknown) => {
        if (data && typeof data === 'object') {
            i18n.addResourceBundle(locale, namespace, data as object, true, true);
        }
    };

    const updateTranslations = () => {
        const data = getInitialData()?.props;
        const translations = (data?.translations || {}) as Record<string, unknown>;
        const availableLocales = getAvailableLocales();
        const availableNamespaces = getAvailableNamespaces(translations, availableLocales);

        availableLocales.forEach((locale) => {
            const localeData = translations[locale] as Record<string, unknown> | undefined;
            if (localeData && typeof localeData === 'object') {
                [...availableNamespaces, ...Object.keys(localeData)].forEach((ns) => {
                    if (!availableNamespaces.includes(ns) || localeData[ns]) {
                        addResourceBundle(locale, ns, localeData[ns]);
                    }
                });
            }
        });

        const queryLocale = new URLSearchParams(window.location.search).get('locale');
        const newLocale = isValidLocale(queryLocale, availableLocales)
            ? queryLocale
            : (typeof data?.locale === 'string' ? data.locale : null);

        if (newLocale && i18n.language !== newLocale) {
            i18n.changeLanguage(newLocale);
        }
    };

    i18n.on('initialized', () => {
        (window as unknown as { tt: unknown }).tt = tt;
        updateTranslations();
    });

    const checkLocaleFromUrl = () => {
        const queryLocale = new URLSearchParams(window.location.search).get('locale');
        const availableLocales = getAvailableLocales();
        if (isValidLocale(queryLocale, availableLocales) && queryLocale && i18n.language !== queryLocale) {
            i18n.changeLanguage(queryLocale);
        }
    };

    window.addEventListener('inertia:success', updateTranslations);
    window.addEventListener('popstate', checkLocaleFromUrl);
    window.addEventListener('hashchange', checkLocaleFromUrl);

    let lastUrl = window.location.href;
    const urlCheckInterval = setInterval(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            checkLocaleFromUrl();
            updateTranslations();
        }
    }, 100);

    const win = window as unknown as { __CLEANUP_INTERVALS?: (() => void)[] };
    if (win.__CLEANUP_INTERVALS) {
        win.__CLEANUP_INTERVALS.push(() => clearInterval(urlCheckInterval));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            updateTranslations();
            checkLocaleFromUrl();
        });
    } else {
        setTimeout(() => {
            updateTranslations();
            checkLocaleFromUrl();
        }, 100);
    }
}

export default i18n;

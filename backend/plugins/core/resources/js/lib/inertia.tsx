import { createInertiaApp } from '@inertiajs/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { ComponentType } from 'react';
import { resolvePluginPages } from '@core/utils/resolve-plugin-pages';
import { initializeZiggy } from '@core/lib/route';
import { getPageGlobsAuto } from '@core/lib/glob-patterns';
import { ReduxStoreProvider } from '@core/redux/Provider';
import '@core/lib/i18n';

// Page module type (matches glob-patterns.ts)
type PageModule = () => Promise<{ default: React.ComponentType<unknown> }>;

// Inertia page component type
type InertiaPageComponent = ComponentType<Record<string, unknown>> | { default: ComponentType<Record<string, unknown>> };

// Type for CSR (Client-Side Rendering) config only
// Using unknown for props to match Inertia's flexible typing
type InertiaAppCSRConfig = {
    title?: (title?: string) => string;
    resolve: (name: string) => Promise<InertiaPageComponent>;
    setup: (options: { el: HTMLElement; App: ComponentType<Record<string, unknown>>; props: Record<string, unknown> }) => void;
    progress?: {
        color?: string;
        delay?: number;
    };
    id?: string;
    defaults?: Record<string, unknown>;
};

interface ZiggyProps {
    routes: Record<string, unknown>;
    location: string;
    defaults?: Record<string, unknown>;
    url?: string;
}

/**
 * Create page resolver function for Inertia
 * Handles both main app pages and plugin pages
 */
export function createPageResolver(
    mainPagesGlob: Record<string, PageModule>,
    pluginPagesCapitalGlob?: Record<string, PageModule>,
    pluginPagesLowerGlob?: Record<string, PageModule>
) {
    return async (name: string) => {
        const pluginPagesCapital = pluginPagesCapitalGlob || {};
        const pluginPagesLower = pluginPagesLowerGlob || {};

        const component = await resolvePluginPages(name, mainPagesGlob, pluginPagesCapital, pluginPagesLower);

        // Inertia expects an object with default property, not null
        if (component === null) {
            // Clear failed cache to allow retry
            const error = new Error(
                `Page component "${name}" not found. ` +
                `Please check that the page file exists and is properly exported. ` +
                `Looking for: ${name.includes('/') ? name.split('/').join('/') + '.tsx' : name + '.tsx'}`
            );
            console.error('[Inertia Resolver]', error.message);
            console.error('[Inertia Resolver] Available plugin pages (lower):', Object.keys(pluginPagesLower).slice(0, 10));
            console.error('[Inertia Resolver] Available plugin pages (capital):', Object.keys(pluginPagesCapital).slice(0, 10));
            throw error;
        }

        // If component is already an object with default, return as is
        // Otherwise, wrap it in an object with default property
        if (typeof component === 'object' && 'default' in component) {
            return component;
        }

        return { default: component };
    };
}


/**
 * Setup Inertia app with Ziggy initialization
 * Automatically finds page globs if not provided
 */
export function setupInertiaApp(
    config: Omit<InertiaAppCSRConfig, 'resolve' | 'setup'> & {
        resolve?: InertiaAppCSRConfig['resolve'];
        mainPagesGlob?: Record<string, PageModule>;
        pluginPagesCapitalGlob?: Record<string, PageModule>;
        pluginPagesLowerGlob?: Record<string, PageModule>;
        setup?: InertiaAppCSRConfig['setup'];
        appName?: string;
    }
) {
    const {
        mainPagesGlob,
        pluginPagesCapitalGlob,
        pluginPagesLowerGlob,
        resolve: customResolve,
        setup: customSetup,
        appName = (import.meta as { env?: { VITE_APP_NAME?: string } }).env?.VITE_APP_NAME || 'Laravel',
        title: customTitle,
        ...restConfig
    } = config;

    // Default title function
    const defaultTitle = (title?: string) => (title ? `${title} - ${appName}` : appName);
    const title = customTitle || defaultTitle;

    // Auto-detect glob patterns if not provided
    const defaultGlobs = getPageGlobsAuto();

    const mainPages = mainPagesGlob || defaultGlobs?.mainPages || {};
    const pluginPagesCapital = pluginPagesCapitalGlob || defaultGlobs?.pluginPagesCapital || {};
    const pluginPagesLower = pluginPagesLowerGlob || defaultGlobs?.pluginPagesLower || {};

    const resolve = customResolve || createPageResolver(mainPages, pluginPagesCapital, pluginPagesLower);

    createInertiaApp({
        ...restConfig,
        title,
        resolve,
        setup({ el, App, props }) {
            if (!el) return;
            const root = createRoot(el);
            const propsAsRecord = props as unknown as Record<string, unknown>;
            const initialPage = propsAsRecord.initialPage as { props?: { ziggy?: ZiggyProps } } | undefined;
            const ziggy = initialPage?.props?.ziggy;
            if (ziggy && typeof ziggy === 'object' && 'routes' in ziggy && 'location' in ziggy) {
                initializeZiggy(ziggy);
            }
            if (customSetup) {
                customSetup({ el, App: App as unknown as ComponentType<Record<string, unknown>>, props: propsAsRecord });
            } else {
                const AppComponent = App as unknown as ComponentType<Record<string, unknown>>;
                root.render(
                    <StrictMode>
                        <ReduxStoreProvider>
                            <AppComponent {...(propsAsRecord as unknown as Record<string, unknown>)} />
                        </ReduxStoreProvider>
                    </StrictMode>
                );
            }
        },
    } as Parameters<typeof createInertiaApp>[0]);
}


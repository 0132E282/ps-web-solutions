import { route as ziggyRoute } from 'ziggy-js';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

interface ZiggyRoute {
    uri: string;
    methods?: string[];
    domain?: string | null;
}

/**
 * Ziggy Config interface matching ziggy-js expectation
 */
interface ZiggyConfig {
    url: string;
    port?: number | null;
    defaults?: Record<string, unknown>;
    routes?: Record<string, ZiggyRoute>;
}

interface ZiggyRouteParams {
    [key: string]: string | number | boolean | undefined | null;
}



interface RouteOptions {
    absolute?: boolean;
    [key: string]: string | number | boolean | undefined | null;
}

interface ZiggyProps extends ZiggyConfig {
    location: string;
    route?: {
        name: string;
        params: Record<string, unknown>;
    };
}


interface InertiaPageProps extends Record<string, unknown> {
    ziggy?: ZiggyProps;
}

interface InertiaPage {
    props: InertiaPageProps;
}

interface ExtendedWindow extends Window {
    Ziggy?: ZiggyProps;
    Inertia?: {
        page: InertiaPage;
    };
}

// Store Ziggy config globally
let ziggyConfig: ZiggyProps | null = null;

const getWindow = (): ExtendedWindow | undefined => {
    if (typeof window !== 'undefined') {
        return window as unknown as ExtendedWindow;
    }
    return undefined;
};

/**
 * Initialize Ziggy routes from Inertia props
 */
export function initializeZiggy(ziggy: ZiggyProps) {
    if (ziggy && ziggy.routes) {
        ziggyConfig = ziggy;
        // Set global Ziggy config
        const win = getWindow();
        if (win) {
            win.Ziggy = {
                routes: ziggy.routes,
                url: ziggy.url || win.location.origin,
                defaults: ziggy.defaults || {},
                location: ziggy.location || win.location.href,
            };
        }
    }
}

// Auto-initialize from window if available (for initial page load)
const win = getWindow();
if (win) {
    const page = win.Inertia?.page;
    if (page?.props?.ziggy) {
        initializeZiggy(page.props.ziggy);
    }
}

export interface RouteFunction {
    (name?: string, params?: ZiggyRouteParams | RouteOptions, options?: RouteOptions): string;
    has(name: string): boolean;
}

const routeFunc = (
    name?: string,
    params?: ZiggyRouteParams | RouteOptions,
    options?: RouteOptions
): string => {
    if (!name) {
        return '';
    }

    // Try to get Ziggy from current Inertia page if not initialized
    if (!ziggyConfig) {
        const win = getWindow();
        const page = win?.Inertia?.page;
        if (page?.props?.ziggy) {
            initializeZiggy(page.props.ziggy);
        }
    }

    // If params is actually options (no params object)
    if (params && typeof params === 'object' && Object.keys(params).length > 0) {
        // Check if params look like route parameters (strings/numbers/booleans) vs options
        const hasRouteParams = Object.values(params).some(
            v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
        );

        if (!hasRouteParams && !('absolute' in params) && options) {
            // params is actually options, shift
            options = params as RouteOptions;
            params = undefined;
        }
    }

    try {
        const routeParams = params as Record<string, string | number | boolean | undefined | null> | undefined;
        const absolute = options?.absolute ?? false;

        // Use unknown as intermediate to bypass strict Ziggy Config checks if needed,
        // but avoid direct 'any'
        /** @ts-expect-error - Ziggy params and config types have complex overloads */
        return ziggyRoute(
            name,
            routeParams,
            absolute,
            (ziggyConfig as unknown)
        ) as string;
    } catch (error) {
        // Only log in development mode to avoid console noise in production
        if (process.env.NODE_ENV === 'development') {
            console.warn(`Route "${name}" not found, returning '#'`, error);
        }
        return '#';
    }
};

/**
 * Check if a route exists
 */
const has = (name: string): boolean => {
    try {
        // Ensure Ziggy is initialized for existence check too
        if (!ziggyConfig) {
            const win = getWindow();
            const page = win?.Inertia?.page;
            if (page?.props?.ziggy) {
                initializeZiggy(page.props.ziggy);
            }
        }

        const config = (ziggyConfig || getWindow()?.Ziggy) as unknown;
        // ziggyRoute() returns a Router instance which has the .has() method
        /** @ts-expect-error - Ziggy router types are not fully exposed in all versions */
        const router = ziggyRoute(
            undefined,
            undefined,
            undefined,
            config
        );

        return (router as { has(name: string): boolean }).has(name);
    } catch {
        return false;
    }
};

export const route = Object.assign(routeFunc, { has });

/**
 * Hook to initialize Ziggy routes from Inertia page props
 * Call this in your root component or layout
 */
export function useZiggy() {
    const { props } = usePage<InertiaPageProps>();

    useEffect(() => {
        if (props.ziggy) {
            initializeZiggy(props.ziggy);
        }
    }, [props.ziggy]);
}

/**
 * Get current route name by matching URL with Ziggy routes
 */
export function getCurrentRouteName(): string | null {
    const win = getWindow();
    if (!win) return null;

    // Try to get from Inertia page props first
    const page = win.Inertia?.page;
    if (page?.props?.ziggy?.route?.name) {
        return page.props.ziggy.route.name;
    }

    // Fallback: match current URL with Ziggy routes
    const currentPath = win.location.pathname;
    const routes = ziggyConfig?.routes || win.Ziggy?.routes;

    if (!routes) {
        // Try to initialize from Inertia page
        if (page?.props?.ziggy) {
            initializeZiggy(page.props.ziggy);
            const routesAfterInit = ziggyConfig?.routes;
            if (routesAfterInit) {
                return matchRouteName(currentPath, routesAfterInit);
            }
        }
        return null;
    }

    return matchRouteName(currentPath, routes);
}

/**
 * Match URL path with Ziggy routes to find route name
 */
function matchRouteName(path: string, routes: Record<string, ZiggyRoute>): string | null {
    // Remove leading/trailing slashes and normalize
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');

    // Try exact match first
    for (const [name, route] of Object.entries(routes)) {
        if (!route || typeof route !== 'object') continue;

        const routeUri = route.uri;
        if (typeof routeUri !== 'string') continue;

        // Normalize route URI
        const normalizedUri = routeUri.replace(/^\/+|\/+$/g, '');

        // Exact match
        if (normalizedUri === normalizedPath) {
            return name;
        }

        // Pattern match (simple regex conversion)
        // Convert Laravel route patterns like {id} to regex
        const pattern = normalizedUri
            .replace(/\{(\w+)\}/g, '([^/]+)')
            .replace(/\{(\w+):(\w+)\}/g, '([^/]+)');

        try {
            const regex = new RegExp(`^${pattern}$`);
            if (regex.test(normalizedPath)) {
                return name;
            }
        } catch {
            // Invalid regex, skip
            continue;
        }
    }

    return null;
}

export function isCurrentRoute(routeName: string): boolean {
    const currentRoute = getCurrentRouteName();
    return currentRoute === routeName;
}


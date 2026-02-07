/* eslint-disable react-hooks/rules-of-hooks */
import { useMemo } from "react";
import { usePage } from "@inertiajs/react";
import { getCurrentRouteName, route } from "@core/lib/route";
import { axios } from '@core/lib/axios';
import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from '@/wayfinder';
import type {
    PagePropsWithViews,
    UseModuleReturn,
    CrudRoutes
} from "@core/types/module";
import {
    buildUrl,
    createGetAction,
    createIdGetAction,
    createIdPutAction,
    createIdDeleteAction,
    createPostAction,
    type IdArgs
} from '@core/utils/wayfinder';

// ============================================================================
// CONSTANTS
// ============================================================================

const CRUD_ACTIONS = ['index', 'create', 'store', 'show', 'edit', 'update', 'destroy', 'import', 'export', 'importTemplate', 'duplicate', 'trash', 'restore', 'force-delete'] as const;

const EMPTY_ROUTES: CrudRoutes = {
    index: null,
    create: null,
    store: null,
    show: null,
    edit: null,
    update: null,
    destroy: null,
    import: null,
    export: null,
    importTemplate: null,
    duplicate: null,
    trash: null,
    restore: null,
    forceDelete: null,
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Shared helper to resolve module action URLs via Ziggy or hardcoded fallback
 */
function resolveModuleUrl(
    resourceName: string,
    action: string,
    urlPattern: string,
    args?: IdArgs,
    options?: RouteQueryOptions
): string {
    const prefix = resourceName.includes('.') ? resourceName.split('.').slice(0, -1).join('.') : `admin.${resourceName}`;
    const hasId = urlPattern.includes('{id}');
    const routeName = `${prefix}.${action}`;

    if (!action.includes('/') && route.has(routeName)) {
        const params = hasId ? { id: '{id}', ...(options?.query ?? {}) } : (options?.query ?? {});
        /** @ts-expect-error - QueryParams is strictly incompatible with ZiggyRouteParams but works at runtime */
        const url = route(routeName, params);
        if (url !== '#') return url.replace(/%7Bid%7D/g, '{id}') + queryParams(options);
    }

    const baseUrl = `/${resourceName.replace(/\.index$/, '')}`;
    const fullPattern = action === 'index' ? baseUrl : `${baseUrl}${urlPattern.startsWith('/') ? '' : '/'}${urlPattern}`;
    return buildUrl(fullPattern, args, options);
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * module Hook
 */
export function useModule(): UseModuleReturn {
    const { props } = usePage<PagePropsWithViews>();
    const currentRouteName = useMemo(() => props?.ziggy?.route?.name || getCurrentRouteName() || null, [props]);

    const { current, view } = useMemo(() => {
        if (!currentRouteName) return { current: null, view: { show: null, edit: null } };
        const parts = currentRouteName.split('.');
        const lastPart = parts[parts.length - 1] as string;
        const baseRoute = ([...CRUD_ACTIONS] as string[]).includes(lastPart) ? parts.slice(0, -1).join('.') : currentRouteName;
        return { current: `${baseRoute}.index`, view: { show: `${baseRoute}.show`, edit: `${baseRoute}.edit` } };
    }, [currentRouteName]);

    const views = useMemo(() => props.views || {}, [props.views]);
    const configs = useMemo(() => props.configs || {}, [props.configs]);

    const getFieldOptions = useMemo(() => (field: Record<string, unknown>, fieldName: string) => {
        const fieldConfig = field?.config as Record<string, unknown> | undefined;
        const modelConfig = configs?.[fieldName];
        return (fieldConfig?.options || field?.options || modelConfig?.config?.options || modelConfig?.options) as Array<{ value: string; label: string }> | undefined;
    }, [configs]);

    const getFilterOptions = useMemo(() => (filter: Record<string, unknown>, filterKey: string) => {
        const filterConfig = filter?.config as Record<string, unknown> | undefined;
        const modelConfig = configs?.[filterKey];
        return (filterConfig?.options || modelConfig?.config?.options) as Array<{ value: string; label: string }> | undefined;
    }, [configs]);

    const crudRoutes = useMemo<CrudRoutes>(() => {
        if (!currentRouteName) return EMPTY_ROUTES;
        const parts = currentRouteName.split('.');
        const lastPart = parts[parts.length - 1] as string;
        const baseRoute = ([...CRUD_ACTIONS] as string[]).includes(lastPart) ? parts.slice(0, -1).join('.') : currentRouteName;
        return CRUD_ACTIONS.reduce((routes, action) => {
            const key = action === 'force-delete' ? 'forceDelete' : action;
            const suffix = action === 'importTemplate' ? 'import-template' : action;
            (routes as unknown as Record<string, string>)[key] = `${baseRoute}.${suffix}`;
            return routes;
        }, {} as CrudRoutes);
    }, [currentRouteName]);

    return { current, view, views, configs, getFieldOptions, getFilterOptions, crudRoutes };
}

/**
 * crudResource Hook
 */
export function crudResource(resourceName: string) {
    return useMemo(() => ({
        index: createGetAction(resolveModuleUrl(resourceName, 'index', '')),
        create: createGetAction(resolveModuleUrl(resourceName, 'create', '/create')),
        show: createIdGetAction(resolveModuleUrl(resourceName, 'show', '/{id}')),
        edit: createIdPutAction(resolveModuleUrl(resourceName, 'edit', '/{id}')),
        store: createPostAction(resolveModuleUrl(resourceName, 'store', '/store')),
        update: createIdPutAction(resolveModuleUrl(resourceName, 'update', '/{id}')),
        destroy: createIdDeleteAction(resolveModuleUrl(resourceName, 'destroy', '/{id}')),
    }), [resourceName]);
}

/**
 * customAction Hook
 */
export function customAction(resourceName: string, method: 'get' | 'post' | 'put' | 'patch' | 'delete', urlPattern: string) {
    return useMemo(() => {
        const actionName = urlPattern.startsWith('/') ? urlPattern.substring(1) : urlPattern.replace(/\W/g, '');
        const httpMethod = method.toUpperCase();

        interface CustomAction {
            (args?: IdArgs, options?: RouteQueryOptions): RouteDefinition<typeof method>;
            definition: RouteDefinition<[typeof method]>;
            url: (args?: IdArgs, options?: RouteQueryOptions) => string;
            form: RouteFormDefinition<'post'> & { put?: (args?: IdArgs, options?: RouteQueryOptions) => RouteFormDefinition<'post'> };
            send: (data?: unknown, args?: IdArgs, options?: RouteQueryOptions, config?: Record<string, unknown>) => Promise<unknown>;
            [key: string]: unknown;
        }

        const action = ((args?: IdArgs, options?: RouteQueryOptions) => ({
            url: (action as CustomAction).url(args, options),
            method
        })) as CustomAction;

        action.definition = { methods: [method], url: `/${resourceName}${urlPattern}` };
        action.url = (args?: IdArgs, options?: RouteQueryOptions) => resolveModuleUrl(resourceName, actionName, urlPattern, args, options);
        action[method] = (args?: IdArgs, options?: RouteQueryOptions) => ({ url: action.url(args, options), method });

        action.form = {
            action: action.url(undefined),
            method: 'post',
            ...(method === 'put' && {
                put: (args?: IdArgs, options?: RouteQueryOptions) => ({
                    action: action.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: httpMethod,
                            ...(options?.query ?? options?.mergeQuery ?? {} as Record<string, unknown>)
                        }
                    }),
                    method: 'post' as const,
                })
            })
        };

        action.send = (data?: unknown, args?: IdArgs, options?: RouteQueryOptions, config?: Record<string, unknown>) => {
            const url = (action as CustomAction).url(args, options);
            const axiosInstance = axios as unknown as Record<string, (url: string, dataOrConfig?: unknown, config?: unknown) => Promise<unknown>>;
            const axiosMethod = axiosInstance[method];
            if (typeof axiosMethod !== 'function') return Promise.reject(new Error(`Method ${method} not supported`));
            return axiosMethod(url, method === 'get' || method === 'delete' ? config : data, config);
        };

        return action;
    }, [resourceName, method, urlPattern]);
}



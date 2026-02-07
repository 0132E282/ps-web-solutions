import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from '@/wayfinder';
import { axios } from '@core/lib/axios';

// ============================================================================
// TYPES
// ============================================================================

export type IdArgs = { id?: string | number } | [id?: string | number] | string | number | undefined;

// ============================================================================
// HELPERS
// ============================================================================

function parseIdArgs(args?: IdArgs): { id?: string | number } {
    if (args === undefined) return {};
    if (typeof args === 'string' || typeof args === 'number') return { id: args };
    if (Array.isArray(args)) return { id: args[0] };
    return args;
}

export function buildUrl(urlPattern: string, args?: IdArgs, options?: RouteQueryOptions): string {
    const parsedArgs = applyUrlDefaults(parseIdArgs(args));
    let url = urlPattern;
    if (parsedArgs.id !== undefined) {
        url = url.replace('{id}', parsedArgs.id.toString());
    }
    return url.replace(/\/+$/, '') + queryParams(options);
}

function createGetForm(action: any, httpMethod: 'GET' | 'HEAD' = 'GET') {
    const form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: action.url(options),
        method: 'get',
    });

    form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: action.url(options),
        method: 'get',
    });

    form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: action.url({
            [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                _method: httpMethod,
                ...(options?.query ?? options?.mergeQuery ?? {}),
            }
        }),
        method: 'get',
    });

    return form;
}

function createPostForm(action: any, method: 'put' | 'post' | 'patch' | 'delete', httpMethod: string) {
    const form = (args?: IdArgs, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: action.url(args, {
            [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                _method: httpMethod,
                ...(options?.query ?? options?.mergeQuery ?? {}),
            }
        }),
        method: 'post',
    });

    (form as any)[method] = (args?: IdArgs, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: action.url(args, {
            [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                _method: httpMethod,
                ...(options?.query ?? options?.mergeQuery ?? {}),
            }
        }),
        method: 'post',
    });

    return form;
}

export function createGetAction(url: string, methods: ['get', 'head'] = ['get', 'head']) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const action: any = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
        url: action.url(options),
        method: 'get',
    });

    action.definition = {
        methods,
        url,
    } satisfies RouteDefinition<typeof methods>;

    action.url = (options?: RouteQueryOptions) => action.definition.url + queryParams(options);
    action.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({ url: action.url(options), method: 'get' });
    action.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({ url: action.url(options), method: 'head' });
    action.form = createGetForm(action);

    return action;
}

export function createIdGetAction(urlPattern: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const action: any = (args?: IdArgs, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
        url: action.url(args, options),
        method: 'get',
    });

    action.definition = {
        methods: ['get', 'head'],
        url: urlPattern,
    } satisfies RouteDefinition<['get', 'head']>;

    action.url = (args?: IdArgs, options?: RouteQueryOptions) => buildUrl(urlPattern, args, options);
    action.get = (args?: IdArgs, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
        url: action.url(args, options),
        method: 'get',
    });
    action.head = (args?: IdArgs, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
        url: action.url(args, options),
        method: 'head',
    });
    action.form = createGetForm(action);

    return action;
}

export function createIdPutAction(urlPattern: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const action: any = (args?: IdArgs, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
        url: action.url(args, options),
        method: 'put',
    });

    action.definition = {
        methods: ['put'],
        url: urlPattern,
    } satisfies RouteDefinition<['put']>;

    action.url = (args?: IdArgs, options?: RouteQueryOptions) => buildUrl(urlPattern, args, options);
    action.put = (args?: IdArgs, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
        url: action.url(args, options),
        method: 'put',
    });
    action.form = createPostForm(action, 'put', 'PUT');

    return action;
}

export function createIdDeleteAction(urlPattern: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const action: any = (args?: IdArgs, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
        url: action.url(args, options),
        method: 'delete',
    });

    action.definition = {
        methods: ['delete'],
        url: urlPattern,
    } satisfies RouteDefinition<['delete']>;

    action.url = (args?: IdArgs, options?: RouteQueryOptions) => buildUrl(urlPattern, args, options);
    action.delete = (args?: IdArgs, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
        url: action.url(args, options),
        method: 'delete',
    });
    action.form = createPostForm(action, 'delete', 'DELETE');

    return action;
}

export function createPostAction(url: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const action: any = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
        url: action.url(options),
        method: 'post',
    });

    action.definition = {
        methods: ['post'],
        url,
    } satisfies RouteDefinition<['post']>;

    action.url = (options?: RouteQueryOptions) => action.definition.url + queryParams(options);
    action.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({ url: action.url(options), method: 'post' });
    action.form = createPostForm(action, 'post', 'POST');

    return action;
}

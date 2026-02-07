export interface PaginationMeta {
    current_page: number;
    from: number;
    last_page: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number;
    total: number;
}

export interface PaginationLinks {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
}

export interface ResourcePagination {
    data: unknown[];
    meta: PaginationMeta;
    links: PaginationLinks;
}

export interface ResourceState<T = Record<string, unknown>> {
    items: T[];
    item: T | null;
    loading: boolean;
    error: string | null;
    pagination: ResourcePagination | null;
    lastParams: Record<string, unknown> | null;
}

export type ResourceActionPayload<T = Record<string, unknown>> = {
    resource: string;
    data?: T | T[];
    id?: string | number;
    params?: Record<string, unknown>;
    pagination?: ResourcePagination;
    error?: string;
};

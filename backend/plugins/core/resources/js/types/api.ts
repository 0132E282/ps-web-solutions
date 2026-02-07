import type { DataTableFilter } from "@core/types/filter";
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";

export interface PaginationInfo {
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
    from?: number;
    to?: number;
}

export interface UrlParams {
    page: number;
    limit: number;
    search: string;
}

export interface DateRangeValue {
    from?: string;
    to?: string;
    [key: string]: unknown;
}

export interface PaginatorData<TData> {
    data?: TData[];
    items?: TData[]; // Added to support 'items' key
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
    from?: number;
    to?: number;
    meta?: PaginationInfo; // Added to support Laravel API Resource 'meta'
}

export interface ExtractResult<TData> {
    items: TData[];
    pagination: PaginationInfo | null;
}

export type FilterOperator = '_like' | '_eq' | '_in' | '_gte' | '_lte';

export interface FilterFormatter {
    (
        columnFilters: ColumnFiltersState,
        filters: DataTableFilter[]
    ): URLSearchParams;
}

export type FilterFunction = (
    row: { getValue: (columnId: string) => unknown },
    columnId: string,
    filterValue: unknown
) => boolean;

export interface ApiResponse<TData> {
    items?: TData[];
    data?: TData[];
    fields?: Record<string, unknown>[];
    columns?: ColumnDef<TData, unknown>[];
    filters?: DataTableFilter[];
    pagination?: PaginationInfo;
    meta?: Record<string, unknown>;
    links?: Record<string, string | null>;
}

export interface TableApiConfig {
    route?: string;
    enabled?: boolean;
    url?: string | null;
}

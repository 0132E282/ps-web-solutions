import type { ColumnDef } from "@tanstack/react-table";
import type { DataTableFilter } from "./filter";
import type { PaginationInfo } from "./api";

export interface InertiaPageProps extends Record<string, unknown> {
    ziggy?: { route?: { name?: string } };
    columns?: ColumnDef<unknown, unknown>[];
    filters?: DataTableFilter[];
    items?: unknown;
    data?: unknown;
    pagination?: PaginationInfo;
    views?: { fields?: unknown[]; [key: string]: unknown };
    configs?: { fields?: unknown[]; filters?: DataTableFilter[]; 'load-items'?: string; [key: string]: unknown };
}

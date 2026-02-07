import { ColumnDef, ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { DataTableFilter } from "@core/types/filter";
import { processColumns } from "@core/utils/table-columns";
import type {
    PaginationInfo,
    UrlParams,
    PaginatorData,
    ExtractResult,
    DateRangeValue,
    FilterFunction,
} from "@core/types/api";

export type { PaginationInfo, UrlParams, ExtractResult } from "@core/types/api";

const isEmptyValue = (value: unknown): boolean =>
    value === "" || value === null || value === undefined;

const isValidValue = (value: unknown): boolean =>
    !isEmptyValue(value) && (typeof value === 'string' ? value.trim() !== '' : true);

export const getUrlParams = (): UrlParams => {
    if (typeof window === 'undefined') {
        return { page: 1, limit: 10, search: '' };
    }
    const urlParams = new URLSearchParams(window.location.search);
    return {
        page: parseInt(urlParams.get('page') || '1', 10),
        limit: parseInt(urlParams.get('limit') || '10', 10),
        search: urlParams.get('search') || '',
    };
};

const addFilterParam = (
    params: URLSearchParams,
    field: string,
    operator: string,
    value: string
): void => {
    params.append(`filters[_and][${field}][${operator}]`, value);
};

/**
 * Get the filter key, prioritizing 'key' over 'name' for backward compatibility
 */
const getFilterKey = (filter: DataTableFilter): string | null => {
    return filter.key || (filter as unknown as Record<string, unknown>).name as string | undefined || null;
};

export const formatFiltersForAPI = (
    columnFilters: ColumnFiltersState,
    filters: DataTableFilter[]
): URLSearchParams => {
    const params = new URLSearchParams();

    columnFilters.forEach((filter) => {
        const filterConfig = filters.find((f) => {
            const filterKey = getFilterKey(f);
            return filterKey === filter.id;
        });
        if (!filterConfig) return;

        const { id: field, value: rawValue } = filter;

        // Check if value is an object with operator and value (from new filter UI)
        let operator: string | undefined;
        let value: unknown = rawValue;

        if (typeof rawValue === 'object' && rawValue !== null && !Array.isArray(rawValue)) {
            const objValue = rawValue as Record<string, unknown>;
            if ('operator' in objValue && 'value' in objValue) {
                operator = String(objValue.operator);
                value = objValue.value;
            }
        }

        // For date-range, handle differently
        if (filterConfig.type === 'date-range') {
            if (typeof rawValue === 'object' && rawValue !== null) {
                const rangeValue = rawValue as DateRangeValue;
                if (rangeValue.from?.trim()) {
                    addFilterParam(params, field, '_gte', rangeValue.from);
                }
                if (rangeValue.to?.trim()) {
                    addFilterParam(params, field, '_lte', rangeValue.to);
                }
            }
            return;
        }

        // Use operator from filter value if available, otherwise use default based on type
        const finalOperator = operator || (() => {
            switch (filterConfig.type) {
                case 'text':
                    return '_like';
                case 'multi-select':
                    return '_in';
                default:
                    return '_eq';
            }
        })();

        // Handle operators that don't need value
        if (finalOperator === '_is_null' || finalOperator === '_is_not_null') {
            params.append(`filters[_and][${field}][${finalOperator}]`, '1');
            return;
        }

        // Handle _between operator
        if (finalOperator === '_between') {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const betweenValue = value as { from?: string; to?: string };
                if (betweenValue.from?.trim()) {
                    addFilterParam(params, field, '_gte', betweenValue.from);
                }
                if (betweenValue.to?.trim()) {
                    addFilterParam(params, field, '_lte', betweenValue.to);
                }
            }
            return;
        }

        // Handle _in and _not_in operators (array values)
        if (finalOperator === '_in' || finalOperator === '_not_in') {
            if (Array.isArray(value) && value.length > 0) {
                value.forEach((v: unknown) => {
                    params.append(`filters[_and][${field}][${finalOperator}][]`, String(v));
                });
            } else if (isValidValue(value)) {
                // Single value, convert to array
                params.append(`filters[_and][${field}][${finalOperator}][]`, String(value));
            }
            return;
        }

        // Skip if value is invalid for other operators
        if (!isValidValue(value)) return;

        // Handle multi-select separately (legacy support)
        if (filterConfig.type === 'multi-select') {
            if (Array.isArray(value) && value.length > 0) {
                value.forEach((v: unknown) => {
                    params.append(`filters[_and][${field}][${finalOperator}][]`, String(v));
                });
            }
            return;
        }

        // For other types, use the operator
        addFilterParam(params, field, finalOperator, String(value).trim());
    });

    return params;
};

/**
 * Format sorting state for API requests
 * Converts SortingState to format: sort[0][order]=desc&sort[0][column]=column_name
 * Only uses the first sort item (single column sorting)
 */
export const formatSortingForAPI = (sorting: SortingState): URLSearchParams => {
    const params = new URLSearchParams();

    // Chỉ lấy phần tử đầu tiên để sort một cột duy nhất
    if (sorting.length > 0 && sorting[0]?.id) {
        const sort = sorting[0];
        params.append('sort[0][column]', sort.id);
        params.append('sort[0][order]', sort.desc ? 'desc' : 'asc');
    }

    return params;
};

export const getWidthStyle = (meta?: { width?: string | number }): React.CSSProperties => {
    if (!meta?.width) return {};

    // Nếu width là số, tự động thêm "px"
    const widthValue = typeof meta.width === "number"
        ? `${meta.width}px`
        : meta.width;

    return {
        width: widthValue,
        minWidth: widthValue,
        maxWidth: widthValue,
    };
};

export const getResourceNameFromRoute = (routeName: string | null): string | null => {
    if (!routeName) return null;

    // Split the route name to handle nested segments (e.g., admin.posts.index)
    const segments = routeName.split('.');

    // If it's a standard admin route (admin.resource.action), the resource is usually the second segment
    if (segments[0] === 'admin' && segments.length >= 2) {
        return segments[1];
    }

    // Fallback: take the first segment if it's not 'admin'
    const resource = segments[0];
    if (resource === 'admin') return null;

    return resource || null;
};

export const mergeColumns = <TData extends Record<string, unknown>>(
    columns: ColumnDef<TData>[],
    baseColumns: ColumnDef<TData>[],
    resourceName?: string | null,
    routeName?: string | null
): ColumnDef<TData>[] => {
    if (!baseColumns?.length) return processColumns(columns, resourceName, routeName);

    const idIndex = baseColumns.findIndex(
        (col) => {
            const colAny = col as unknown as { accessorKey?: string; id?: string };
            return colAny.accessorKey === "id" || col.id === "id";
        }
    );

    if (idIndex === -1) {
        const selectColumn = baseColumns.find((col) => col.id === "select");
        const actionsColumn = baseColumns.find((col) => col.id === "actions");
        const otherBaseColumns = baseColumns.filter(
            (col) => col.id !== "select" && col.id !== "actions"
        );

        return processColumns([
            ...(selectColumn ? [selectColumn] : []),
            ...otherBaseColumns,
            ...columns,
            ...(actionsColumn ? [actionsColumn] : []),
        ], resourceName, routeName);
    }

    return processColumns([
        ...baseColumns.slice(0, idIndex + 1),
        ...columns,
        ...baseColumns.slice(idIndex + 1),
    ], resourceName, routeName);
};

const createMultipleSelectFilter = (): FilterFunction => {
    return (row, columnId, filterValue) => {
        if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) {
            return true;
        }
        const rowValue = row.getValue(columnId);
        if (rowValue == null) return false;
        if (Array.isArray(rowValue)) {
            return filterValue.some((fv) =>
                rowValue.some((rv: unknown) => String(rv) === String(fv))
            );
        }
        return filterValue.includes(String(rowValue));
    };
};

const createDateRangeFilter = (): FilterFunction => {
    return (row, columnId, filterValue) => {
        if (!filterValue) return true;

        const dateRange = filterValue as DateRangeValue;
        if (!dateRange.from && !dateRange.to) return true;

        const rowValue = row.getValue(columnId);
        if (rowValue == null) return false;

        const rowDate = new Date(rowValue as string | number | Date);
        if (isNaN(rowDate.getTime())) return false;

        if (dateRange.from) {
            const fromDate = new Date(dateRange.from);
            fromDate.setHours(0, 0, 0, 0);
            if (rowDate < fromDate) return false;
        }

        if (dateRange.to) {
            const toDate = new Date(dateRange.to);
            toDate.setHours(23, 59, 59, 999);
            if (rowDate > toDate) return false;
        }

        return true;
    };
};

const createDefaultFilter = (): FilterFunction => {
    return (row, columnId, filterValue) => {
        if (!filterValue) return true;
        const rowValue = row.getValue(columnId);
        if (rowValue == null) return false;
        const filterStr = String(filterValue).toLowerCase().trim();
        const rowStr = String(rowValue).toLowerCase();
        return rowStr.includes(filterStr);
    };
};

export const createFilterFn = (filter: DataTableFilter): FilterFunction => {
    if (filter.type === "multi-select") {
        return createMultipleSelectFilter();
    }
    if (filter.type === "date-range") {
        return createDateRangeFilter();
    }
    return createDefaultFilter();
};

export const extractFromPaginator = <TData,>(
    paginatorData: unknown
): ExtractResult<TData> => {
    if (!paginatorData) return { items: [], pagination: null };

    const data = paginatorData as PaginatorData<TData>;

    const items = (data.items || data.data);
    if (items && Array.isArray(items)) {
        let pagination: PaginationInfo | null = null;

        // Try to extract pagination if available
        if (typeof data.current_page === 'number' || typeof data.meta?.current_page === 'number') {
            pagination = {
                current_page: data.current_page ?? data.meta?.current_page ?? 1,
                per_page: data.per_page ?? data.meta?.per_page ?? 20,
                total: data.total ?? data.meta?.total ?? 0,
                last_page: data.last_page ?? data.meta?.last_page ?? 1,
                from: data.from ?? data.meta?.from ?? undefined,
                to: data.to ?? data.meta?.to ?? undefined,
            };
        }

        return {
            items: items as TData[],
            pagination
        };
    }

    if (Array.isArray(paginatorData)) {
        return { items: paginatorData as TData[], pagination: null };
    }

    return { items: [], pagination: null };
};

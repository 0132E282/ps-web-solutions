import { ColumnFiltersState } from "@tanstack/react-table";
import { DataTableFilter } from "@core/types/filter";
import { DateRangeValue, FilterFunction } from "@core/types/api";

const isEmptyValue = (value: unknown): boolean =>
    value === "" || value === null || value === undefined;

const isValidValue = (value: unknown): boolean =>
    !isEmptyValue(value) && (typeof value === 'string' ? value.trim() !== '' : true);

export const encodeFilters = (filters: unknown): string => {
    try {
        const str = JSON.stringify(filters);
        return window.btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
        return "";
    }
};

export const decodeFilters = <T>(encoded: string | null): T | null => {
    if (!encoded) return null;
    try {
        const str = decodeURIComponent(escape(window.atob(encoded)));
        return JSON.parse(str) as T;
    } catch (e) {
        return null;
    }
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

/**
 * Format column filters into API-compatible URL search parameters
 */
export const formatFiltersForAPI = (
    columnFilters: ColumnFiltersState,
    filters: DataTableFilter[]
): URLSearchParams => {
    const params = new URLSearchParams();

    columnFilters.forEach((filter) => {
        const filterConfig = filters.find((f) => getFilterKey(f) === filter.id);
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

        // Handle date-range type specifically
        if (filterConfig.type === 'date-range') {
            if (typeof rawValue === 'object' && rawValue !== null) {
                const rangeValue = rawValue as DateRangeValue;
                if (rangeValue.from?.trim()) addFilterParam(params, field, '_gte', rangeValue.from);
                if (rangeValue.to?.trim()) addFilterParam(params, field, '_lte', rangeValue.to);
            }
            return;
        }

        // Determine operator based on filter configuration or defaults
        const finalOperator = operator || (() => {
            switch (filterConfig.type) {
                case 'text': return '_like';
                case 'multi-select': return '_in';
                default: return '_eq';
            }
        })();

        // Handle operator-only filters
        if (['_is_null', '_is_not_null'].includes(finalOperator)) {
            params.append(`filters[_and][${field}][${finalOperator}]`, '1');
            return;
        }

        // Handle between operator
        if (finalOperator === '_between') {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const betweenValue = value as { from?: string; to?: string };
                if (betweenValue.from?.trim()) addFilterParam(params, field, '_gte', betweenValue.from);
                if (betweenValue.to?.trim()) addFilterParam(params, field, '_lte', betweenValue.to);
            }
            return;
        }

        // Handle array-based operators (_in, _not_in)
        if (['_in', '_not_in'].includes(finalOperator)) {
            if (Array.isArray(value) && value.length > 0) {
                value.forEach((v) => params.append(`filters[_and][${field}][${finalOperator}][]`, String(v)));
            } else if (isValidValue(value)) {
                params.append(`filters[_and][${field}][${finalOperator}][]`, String(value));
            }
            return;
        }

        if (!isValidValue(value)) return;

        // Legacy multi-select support
        if (filterConfig.type === 'multi-select' && Array.isArray(value)) {
            value.forEach((v) => params.append(`filters[_and][${field}][${finalOperator}][]`, String(v)));
            return;
        }

        addFilterParam(params, field, finalOperator, String(value).trim());
    });

    return params;
};

/* --- Internal Filter Functions --- */

const createMultipleSelectFilter = (): FilterFunction => (row, columnId, filterValue) => {
    if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true;
    const rowValue = row.getValue(columnId);
    if (rowValue == null) return false;

    if (Array.isArray(rowValue)) {
        return filterValue.some((fv) => rowValue.some((rv) => String(rv) === String(fv)));
    }
    return filterValue.includes(String(rowValue));
};

const createDateRangeFilter = (): FilterFunction => (row, columnId, filterValue) => {
    if (!filterValue) return true;
    const { from, to } = filterValue as DateRangeValue;
    if (!from && !to) return true;

    const rowValue = row.getValue(columnId);
    if (rowValue == null) return false;

    const rowDate = new Date(rowValue as string | number | Date);
    if (isNaN(rowDate.getTime())) return false;

    if (from) {
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        if (rowDate < fromDate) return false;
    }
    if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        if (rowDate > toDate) return false;
    }
    return true;
};

const createDefaultFilter = (): FilterFunction => (row, columnId, filterValue) => {
    if (!filterValue) return true;
    const rowValue = row.getValue(columnId);
    if (rowValue == null) return false;
    return String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase().trim());
};

/**
 * Creates a filter function compatible with TanStack table based on local filter configuration
 */
export const createFilterFn = (filter: DataTableFilter): FilterFunction => {
    switch (filter.type) {
        case "multi-select": return createMultipleSelectFilter();
        case "date-range": return createDateRangeFilter();
        default: return createDefaultFilter();
    }
};

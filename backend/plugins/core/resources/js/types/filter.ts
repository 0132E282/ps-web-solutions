export interface DataTableFilter {
    id: string;
    key: string;
    value: unknown;
    label?: string;
    type?: FilterType;
    options?: any[];
}

export type FilterType = 'text' | 'select' | 'date' | 'boolean' | 'number';

export interface FilterConfig {
    type: FilterType;
    options?: { label: string; value: string | number }[];
    placeholder?: string;
    label?: string;
}

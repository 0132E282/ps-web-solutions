import { Input } from "@core/components/ui/input";
import { getColumnKey } from "@core/hooks/use-datatable";
import { useModule } from "@core/hooks/use-module";
import { tt } from "@core/lib/i18n";
import type { DataTableFilter } from "@core/types/filter";
import { type ColumnDef, type Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { useCallback, useMemo } from "react";
import { default as AdvancedFilter, type AdvancedFilterCondition, type AdvancedFilterField } from "../advanced-filter";
import { ColumnVisibilityDropdown } from "./column-visibility-dropdown";

interface DataTableToolbarProps<TData, TValue> {
    table: Table<TData>;
    searchValue: string;
    onSearchChange: (value: string) => void;
    onSearchClear: () => void;
    searchPlaceholder?: string;
    // Raw inputs for filter calculation
    apiFilters: DataTableFilter[];
    mergedColumns: ColumnDef<TData, TValue>[];
    // Filter State
    advancedFilters: AdvancedFilterCondition[];
    onAdvancedFiltersChange: (filters: AdvancedFilterCondition[]) => void;
    onAdvancedFilterApply: () => void;
    onAdvancedFilterClear: () => void;
    effectiveUseApi: boolean;
}

export function DataTableToolbar<TData, TValue>({
    table,
    searchValue,
    onSearchChange,
    onSearchClear,
    searchPlaceholder,
    apiFilters,
    mergedColumns,
    advancedFilters,
    onAdvancedFiltersChange,
    onAdvancedFilterApply,
    onAdvancedFilterClear,
    effectiveUseApi,
}: DataTableToolbarProps<TData, TValue>) {
    const hasSearchValue = Boolean(searchValue);
    const { views: viewsData, configs } = useModule();

    // Logic moved from use-advanced-filters.ts
    const normalizeOptions = useCallback((options: unknown): { label: string; value: string }[] | undefined => {
        if (!options) return undefined;
        if (Array.isArray(options)) return options as { label: string; value: string }[];
        if (typeof options === 'object') {
            return Object.entries(options as Record<string, string>).map(([value, label]) => ({
                value,
                label: String(label)
            }));
        }
        return undefined;
    }, []);

    const viewFiltersMap = useMemo(() => {
        const map = new Map<string, Record<string, unknown>>();
        if (viewsData?.filters && Array.isArray(viewsData.filters)) {
            viewsData.filters.forEach((vf: unknown) => {
                const filter = vf as Record<string, unknown>;
                const key = (filter.name || filter.key) as string | undefined;
                if (key) map.set(key, filter);
            });
        }
        return map;
    }, [viewsData?.filters]);

    const filterFields: AdvancedFilterField[] = useMemo(() => {
        if (apiFilters.length > 0) {
            return apiFilters.map((f) => {
                const fieldConfig = configs?.[f.key]?.config as Record<string, unknown> | undefined;
                const viewFilter = viewFiltersMap.get(f.key);

                const rawOptions = (f.options) ||
                                   (fieldConfig?.options) ||
                                   (viewFilter?.config?.options) ||
                                   (viewFilter?.options);

                const options = normalizeOptions(rawOptions);
                const collection = (fieldConfig?.collection || viewFilter?.config?.collection || viewFilter?.collection) as AdvancedFilterField['collection'];

                let type = (f.type as AdvancedFilterField['type']) || 'text';

                if (collection && (type === 'text' || !type)) {
                    type = 'select';
                } else if (options && options.length > 0 && (type === 'text' || !type)) {
                    type = 'select';
                }

                return {
                    key: f.key,
                    label: f.label || f.key,
                    type: type as AdvancedFilterField['type'],
                    options,
                    collection
                };
            });
        }

        return mergedColumns
            .filter(col => {
                const colId = getColumnKey(col);
                const colProps = col as unknown as Record<string, unknown>;
                const colType = colProps.type as string | undefined;
                return colId &&
                    colId !== 'select' &&
                    colId !== 'actions' &&
                    colProps.filterable !== false &&
                    colType !== 'attachment' &&
                    colType !== 'attachments';
            })
            .map(col => {
                const colId = getColumnKey(col) || '';
                const colProps = col as unknown as Record<string, unknown>;
                const header = typeof col.header === 'string' ? col.header : String(colId || '');

                const fieldConfig = configs?.[colId]?.config as Record<string, unknown> | undefined;
                const rawOptions = (colProps.options) || (fieldConfig?.options);
                const options = normalizeOptions(rawOptions);
                const collection = (fieldConfig?.collection) as AdvancedFilterField['collection'];

                let type = (colProps.type as AdvancedFilterField['type']) || 'text';

                if (collection && (type === 'text' || !type)) {
                    type = 'select';
                } else if (options && options.length > 0 && (type === 'text' || !type)) {
                    type = 'select';
                }

                return {
                    key: colId,
                    label: header,
                    type,
                    options,
                    collection,
                };
            });
    }, [apiFilters, mergedColumns, configs, viewFiltersMap, normalizeOptions]);

    return (
        <div className="flex items-center gap-4 flex-wrap">

            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                <Input
                    placeholder={searchPlaceholder || tt('common.search_placeholder')}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 pr-10"
                />
                {hasSearchValue && (
                    <button
                        type="button"
                        onClick={onSearchClear}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={tt('common.clear_search')}
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-4 ml-auto">
                {filterFields.length > 0 && effectiveUseApi && (
                    <AdvancedFilter
                        fields={filterFields}
                        conditions={advancedFilters}
                        onConditionsChange={onAdvancedFiltersChange}
                        onApply={onAdvancedFilterApply}
                        onClear={onAdvancedFilterClear}
                    />
                )}
                <ColumnVisibilityDropdown table={table} />
            </div>
        </div>
    );
}

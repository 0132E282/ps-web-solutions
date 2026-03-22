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
    resourceName?: string | null;
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
    resourceName,
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
        const NON_FILTERABLE_TYPES = ['attachment', 'attachments', 'image', 'media', 'file'];

        const buildFilterField = (
            id: string,
            initialLabel: string,
            initialType: string | undefined,
            initialOptions: any[] | undefined
        ): AdvancedFilterField | null => {
            const fieldConfig = configs?.[id]?.config as Record<string, unknown> | undefined;
            const viewFilter = viewFiltersMap.get(id) as Record<string, any> | undefined;

            const effectiveType = (viewFilter?.ui || viewFilter?.type || fieldConfig?.ui || fieldConfig?.type || initialType) as string;

            if (NON_FILTERABLE_TYPES.includes(effectiveType) || NON_FILTERABLE_TYPES.includes(id)) {
                return null;
            }

            const rawOptions = initialOptions || fieldConfig?.options || viewFilter?.config?.options || viewFilter?.options;
            const options = normalizeOptions(rawOptions);
            const collection = (fieldConfig?.collection || viewFilter?.config?.collection || viewFilter?.collection) as AdvancedFilterField['collection'];

            let type = initialType || effectiveType || 'text';

            if (['string', 'text', 'varchar'].includes(type) && collection) {
                type = 'select';
            } else if (['string', 'text', 'varchar'].includes(type) && options && options.length > 0) {
                type = 'select';
            } else if (!['text', 'select', 'date', 'boolean', 'number'].includes(type)) {
                type = 'text';
            }

            return {
                key: id,
                label: initialLabel,
                type: type as AdvancedFilterField['type'],
                options,
                collection
            };
        };

        if (apiFilters.length > 0) {
            return apiFilters
                .map(f => buildFilterField(f.key, f.label || f.key, f.type, f.options))
                .filter((f): f is AdvancedFilterField => f !== null);
        }

        return mergedColumns
            .map(col => {
                const colId = getColumnKey(col);
                if (!colId || colId === 'select' || colId === 'actions') return null;

                const colProps = col as unknown as Record<string, unknown>;
                if (colProps.filterable === false) return null;

                const header = typeof col.header === 'string' ? col.header : String(colId);
                return buildFilterField(colId, header, colProps.type as string | undefined, colProps.options as any[] | undefined);
            })
            .filter((f): f is AdvancedFilterField => f !== null);
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
                <ColumnVisibilityDropdown table={table} resourceName={resourceName} />
            </div>
        </div>
    );
}

import { Input } from "@core/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@core/components/ui/toggle-group";
import { tt } from "@core/lib/i18n";
import type { DataTableFilter } from "@core/types/filter";
import { type ColumnDef, type Table } from "@tanstack/react-table";
import { List, Network, Search, X } from "lucide-react";
import { default as AdvancedFilter, type AdvancedFilterCondition } from "../advanced-filter";
import { ColumnVisibilityDropdown } from "./column-visibility-dropdown";
import { useAdvancedFilterFields } from "@core/hooks/use-advanced-filter-fields";

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
    viewMode?: string;
    layouts?: string[];
    onViewModeChange?: (mode: string) => void;
}

/**
 * DataTableToolbar Component
 * 
 * Provides search, advanced filtering, column visibility, 
 * and view mode switching functionalities.
 */
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
    viewMode,
    layouts = ['table'],
    onViewModeChange,
}: DataTableToolbarProps<TData, TValue>) {
    const hasSearchValue = Boolean(searchValue);

    // Extract filter field building logic into a custom hook
    const filterFields = useAdvancedFilterFields({ apiFilters, mergedColumns });

    return (
        <div className="flex items-center gap-4 flex-wrap">
            {/* Global Search Input */}
            <div className="relative flex-1">
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
                {/* Advanced Filter UI */}
                {filterFields.length > 0 && effectiveUseApi && (
                    <AdvancedFilter
                        fields={filterFields}
                        conditions={advancedFilters}
                        onConditionsChange={onAdvancedFiltersChange}
                        onApply={onAdvancedFilterApply}
                        onClear={onAdvancedFilterClear}
                    />
                )}

                {/* Column Visibility Control */}
                <ColumnVisibilityDropdown table={table} resourceName={resourceName} />
                
                {/* View Mode Togglers (Table vs Tree) */}
                {viewMode && layouts.length > 1 && (
                    <ToggleGroup 
                        type="single" 
                        value={viewMode} 
                        onValueChange={(val) => val && onViewModeChange?.(val)} 
                        className="border bg-background/50 rounded-lg p-1 shadow-sm h-9 ml-2"
                    >
                        {layouts.includes('table') && (
                            <ToggleGroupItem 
                                value="table" 
                                aria-label="Table View" 
                                size="sm" 
                                className="h-7 w-8 px-0 data-[state=on]:bg-primary! data-[state=on]:text-primary-foreground! data-[state=on]:shadow-sm rounded-md transition-all"
                            >
                                <List className="h-4 w-4" />
                            </ToggleGroupItem>
                        )}
                        {layouts.includes('tree') && (
                            <ToggleGroupItem 
                                value="tree" 
                                aria-label="Tree View" 
                                size="sm" 
                                className="h-7 w-8 px-0 data-[state=on]:bg-primary! data-[state=on]:text-primary-foreground! data-[state=on]:shadow-sm rounded-md transition-all"
                            >
                                <Network className="h-4 w-4" />
                            </ToggleGroupItem>
                        )}
                    </ToggleGroup>
                )}
            </div>
        </div>
    );
}

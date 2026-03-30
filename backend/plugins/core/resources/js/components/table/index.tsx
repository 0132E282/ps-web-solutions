"use client";

import { ScrollArea } from "@core/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableRow } from "@core/components/ui/table";
import { useDataTable } from "@core/hooks/use-datatable";
import type { DataTableProps } from "@core/hooks/use-datatable";
import { tt } from "@core/lib/i18n";
import { DataTablePagination } from "./pagination";
import { DataTableToolbar } from "./toolbar";
import { DataTableHeader } from "./table-header";
import { DataTableRow } from "./table-row";

// Re-export core table logic
export type { DataTableProps } from "@core/hooks/use-datatable";
export { 
    useDataTable, 
    useDataTableRoute, 
    useDataTableData, 
    useDataTableColumns, 
    getColumnKey 
} from "@core/hooks/use-datatable";

// Re-export table registry
export { tableRegistry } from "./table-registry";

// Re-export utilities (Maintaining backward compatibility through barrel)
export { 
    getUrlParams, 
    extractFromPaginator, 
    formatFiltersForAPI, 
    mergeColumns, 
    createFilterFn, 
    getWidthStyle,
    type PaginationInfo
} from "./helpers";

// Export sub-components
export { DataTablePagination } from "./pagination";
export { DataTableToolbar } from "./toolbar";

/**
 * DataTable Component
 * 
 * A powerful, modular table component built on TanStack Table.
 * Supports tree nodes, column reordering, advanced filtering, and more.
 */
export function DataTable<TData extends Record<string, unknown>, TValue>(
    props: DataTableProps<TData, TValue>
) {
    const hookData = useDataTable(props);
    const {
        table,
        isLoading,
        mergedColumns,
        paginationInfo,
        toolbarRow,
        isTreeMode,
        toggleRowExpansion,
        expandedRows,
        rowSelection,
        updateSearch,
        handleSearchClear,
        handleAdvancedFilterApply,
        handleAdvancedFilterClear,
    } = hookData;

    const rows = table.getRowModel().rows;
    const columnsCount = mergedColumns.length;

    return (
        <div className="w-full space-y-4">
            <DataTableToolbar
                {...hookData}
                onSearchChange={updateSearch}
                onSearchClear={handleSearchClear}
                onAdvancedFilterApply={handleAdvancedFilterApply}
                onAdvancedFilterClear={handleAdvancedFilterClear}
                onAdvancedFiltersChange={hookData.setAdvancedFilters}
                resourceName={hookData.resourceName}
                viewMode={props.viewMode}
                layouts={props.layouts}
                onViewModeChange={props.onViewModeChange}
            />

            <div className="rounded-md border overflow-visible">
                <ScrollArea className="w-full">
                    <div className="[&>div]:overflow-visible! [&>div]:w-auto! [&_table]:min-w-full">
                        <Table>
                            <DataTableHeader 
                                table={table} 
                                isTreeMode={isTreeMode} 
                                rowSelection={rowSelection} 
                            />
                            
                            <TableBody>
                                {isLoading ? (
                                    <TableRow className="min-h-[80px]">
                                        <TableCell colSpan={columnsCount} className="h-24 text-center">
                                            {tt('common.loading')}
                                        </TableCell>
                                    </TableRow>
                                ) : rows.length === 0 ? (
                                    <TableRow className="min-h-[80px]">
                                        <TableCell colSpan={columnsCount} className="h-24 text-center">
                                            {tt('common.no_results')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rows.map((row) => (
                                        <DataTableRow
                                            key={row.id}
                                            row={row}
                                            mergedColumns={mergedColumns}
                                            isTreeMode={isTreeMode}
                                            expandedRows={expandedRows}
                                            toggleRowExpansion={toggleRowExpansion}
                                            rowSelection={rowSelection}
                                            toolbarRow={toolbarRow}
                                        />
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </ScrollArea>
            </div>

            <DataTablePagination
                table={table}
                pageSize={hookData.pageSize}
                setPageSize={hookData.handlePageSizeChange}
                pageIndex={hookData.pageIndex}
                setPageIndex={hookData.handlePageIndexChange}
                paginationInfo={paginationInfo}
            />
        </div>
    );
}

"use client";

import { ScrollArea } from "@core/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@core/components/ui/table";
import { useDataTable } from "@core/hooks/use-datatable";
import type { DataTableProps } from "@core/hooks/use-datatable";
import { tt } from "@core/lib/i18n";
import { cn } from "@core/lib/utils";
import { flexRender } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { getWidthStyle } from "./helpers";
import { DataTablePagination } from "./pagination";
import { DataTableToolbar } from "./toolbar";

// Export types and interfaces
export type { DataTableProps } from "@core/hooks/use-datatable";
export type { PaginationInfo } from "./helpers";

// Export hooks
export { useDataTable, useDataTableRoute, useDataTableData, useDataTableColumns, getColumnKey } from "@core/hooks/use-datatable";

// Export utilities
export { getUrlParams, extractFromPaginator, formatFiltersForAPI, mergeColumns, createFilterFn, getWidthStyle } from "./helpers";

// Export table registry
export { tableRegistry } from "./table-registry";

// Export sub-components (optional, nếu cần)
export { DataTablePagination } from "./pagination";
export { DataTableToolbar } from "./toolbar";

export function DataTable<TData extends Record<string, unknown>, TValue>(props: DataTableProps<TData, TValue>) {
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
            />

            <div className="rounded-md border overflow-visible">
                <ScrollArea className="w-full">
                    <div className="[&>div]:overflow-visible! [&>div]:w-auto! [&_table]:min-w-full">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id} className="hover:bg-muted">
                                        {headerGroup.headers.map((header, i) => {
                                            const meta = header.column.columnDef.meta as { width?: string | number } | undefined;
                                            const firstDataHeaderIndex = headerGroup.headers.findIndex(h => h.column.id !== 'select');
                                            const isTreeColumnHeader = i === (firstDataHeaderIndex !== -1 ? firstDataHeaderIndex : 0) && isTreeMode;

                                            return (
                                                <TableHead
                                                    key={header.id + (header.column.id === 'select' ? `-${Object.keys(rowSelection).length}-${JSON.stringify(rowSelection).length}` : '')}
                                                    style={getWidthStyle(meta)}
                                                    className={cn(meta?.width && "wrap-break-word")}
                                                >
                                                    {!header.isPlaceholder && (
                                                        isTreeColumnHeader ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-6 w-6 shrink-0" />
                                                                <div className="flex items-center">
                                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                                </div>
                                                            </div>
                                                        ) : flexRender(header.column.columnDef.header, header.getContext())
                                                    )}
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow className="min-h-[80px]">
                                        <TableCell colSpan={columnsCount} className="h-24 text-center">{tt('common.loading')}</TableCell>
                                    </TableRow>
                                ) : rows.length === 0 ? (
                                    <TableRow className="min-h-[80px]">
                                        <TableCell colSpan={columnsCount} className="h-24 text-center">{tt('common.no_results')}</TableCell>
                                    </TableRow>
                                ) : (
                                    rows.map((row) => {
                                        const rowData = row.original as Record<string, unknown>;
                                        const level = isTreeMode && typeof rowData._level === 'number' ? rowData._level : 0;
                                        const hasChildren = isTreeMode && rowData._hasChildren === true;
                                        const rowId = String(isTreeMode && rowData._id != null ? rowData._id : (row.id ?? (row.original as any).id));
                                        const isExpanded = isTreeMode && (expandedRows.has(rowId) || expandedRows.has(Number(rowId)) || expandedRows.has(String(rowId)));
                                        const isSelected = (rowSelection as Record<string, boolean>)?.[rowId] || false;

                                        // Find index of first column that isn't the selection checkbox
                                        const firstDataColumnIndex = mergedColumns.findIndex(c => c.id !== 'select');
                                        const treeColumnIndex = firstDataColumnIndex !== -1 ? firstDataColumnIndex : 0;

                                        return (
                                            <Fragment key={row.id}>
                                                <TableRow data-state={isSelected && "selected"} className="group/row">
                                                    {row.getVisibleCells().map((cell, i) => {
                                                        const meta = cell.column.columnDef.meta as { width?: string | number } | undefined;
                                                        const isTreeColumn = i === treeColumnIndex && isTreeMode;

                                                        return (
                                                            <TableCell
                                                                key={cell.id}
                                                                style={getWidthStyle(meta)}
                                                                className={cn(
                                                                    "py-3",
                                                                    meta?.width && "wrap-break-word"
                                                                )}
                                                            >
                                                                {isTreeColumn ? (
                                                                    <div
                                                                        style={{ paddingLeft: level > 0 ? `${level * 24}px` : '0' }}
                                                                        className="flex items-center gap-2"
                                                                    >
                                                                        <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                                                                            {hasChildren ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        toggleRowExpansion(rowId);
                                                                                    }}
                                                                                    className="h-6 w-6 p-0 hover:bg-accent hover:text-accent-foreground rounded-md transition-all flex items-center justify-center cursor-pointer border border-transparent hover:border-border"
                                                                                >
                                                                                    <ChevronRight className={cn(
                                                                                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                                                                        isExpanded && "rotate-90 text-primary  hover:text-accent-foreground "
                                                                                    )} />
                                                                                </button>
                                                                            ) : (
                                                                                level > 0 && <div className="h-full w-px bg-border/50 ml-3" />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                                        </div>
                                                                    </div>
                                                                ) : flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                                {toolbarRow && (
                                                    <TableRow>
                                                        <TableCell colSpan={row.getVisibleCells().length} className="p-0 border-b-0">
                                                            {toolbarRow(row.original)}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </Fragment>
                                        );
                                    })
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



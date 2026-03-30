import { Fragment } from "react";
import { TableRow, TableCell } from "@core/components/ui/table";
import { cn } from "@core/lib/utils";
import { flexRender, type Row } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { getWidthStyle } from "./helpers";

interface DataTableRowProps<TData> {
    row: Row<TData>;
    mergedColumns: any[];
    isTreeMode?: boolean;
    expandedRows: Set<string | number>;
    toggleRowExpansion: (id: string | number) => void;
    rowSelection: Record<string, boolean>;
    toolbarRow?: (data: TData) => React.ReactNode;
}

export function DataTableRow<TData extends Record<string, unknown>>({
    row,
    mergedColumns,
    isTreeMode,
    expandedRows,
    toggleRowExpansion,
    rowSelection,
    toolbarRow,
}: DataTableRowProps<TData>) {
    const rowData = row.original;
    const level = isTreeMode && typeof rowData._level === 'number' ? rowData._level : 0;
    const hasChildren = isTreeMode && rowData._hasChildren === true;
    const rowId = String(isTreeMode && rowData._id != null ? rowData._id : (row.id ?? (row.original as any).id));
    const isExpanded = isTreeMode && (expandedRows.has(rowId) || expandedRows.has(Number(rowId)) || expandedRows.has(String(rowId)));
    const isSelected = (rowSelection as Record<string, boolean>)?.[rowId] || false;

    // Find index of first column that isn't the selection checkbox for tree indentation
    const firstDataColumnIndex = mergedColumns.findIndex(c => c.id !== 'select');
    const treeColumnIndex = firstDataColumnIndex !== -1 ? firstDataColumnIndex : 0;

    return (
        <Fragment>
            <TableRow
                data-state={isSelected && "selected"}
                className="group/row transition-all"
            >
                {row.getVisibleCells().map((cell, i) => {
                    const meta = cell.column.columnDef.meta as { width?: string | number } | undefined;
                    const isTreeColumn = i === treeColumnIndex && isTreeMode;

                    return (
                        <TableCell
                            key={cell.id}
                            style={getWidthStyle(meta)}
                            className={cn("py-3", meta?.width && "wrap-break-word")}
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
                                                    isExpanded && "rotate-90 text-primary hover:text-accent-foreground"
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
                            ) : (
                                flexRender(cell.column.columnDef.cell, cell.getContext())
                            )}
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
}

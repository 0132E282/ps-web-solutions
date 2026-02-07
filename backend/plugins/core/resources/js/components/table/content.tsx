import { Fragment } from "react";
import { flexRender, Table as ReactTable } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@core/components/ui/table";
import { ScrollArea } from "@core/components/ui/scroll-area";
import { cn } from "@core/lib/utils";
import { tt } from "@core/lib/i18n";
import { getWidthStyle } from "./helpers";

interface DataTableContentProps<TData> {
    table: ReactTable<TData>;
    isLoading: boolean;
    error: string | null;
    mergedColumnsLength: number;
    isTreeMode: boolean;
    expandedRows: Set<string | number>;
    onToggleRowExpansion: (rowId: string | number) => void;
    toolbarRow?: (row: TData) => React.ReactNode;
}


export function DataTableContent<TData>({
    table,
    isLoading,
    error,
    mergedColumnsLength,
    isTreeMode,
    expandedRows,
    onToggleRowExpansion,
    toolbarRow
}: DataTableContentProps<TData>) {
  const rows = table.getRowModel().rows;
    if (isLoading) {
        return (
             <div className="rounded-md border overflow-visible">
                <ScrollArea className="w-full">
                    <div className="[&>div]:overflow-visible! [&>div]:w-auto! [&_table]:min-w-full">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id} className="hover:bg-muted">
                                        {headerGroup.headers.map((header) => {
                                             const meta = header.column.columnDef.meta as { width?: string | number } | undefined;
                                            return (
                                                <TableHead key={header.id} style={getWidthStyle(meta)} className={meta?.width ? "wrap-break-word" : ""}>
                                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={mergedColumnsLength} className="h-24 text-center">
                                        {tt('common.loading')}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </ScrollArea>
            </div>
        )
    }

    if (error) {
         return (
             <div className="rounded-md border overflow-visible">
                <ScrollArea className="w-full">
                     <Table><TableBody><TableRow><TableCell colSpan={mergedColumnsLength} className="h-24 text-center text-destructive">{error}</TableCell></TableRow></TableBody></Table>
                </ScrollArea>
            </div>
        )
    }

    return (
        <div className="rounded-md border overflow-visible">
            <ScrollArea className="w-full">
                <div className="[&>div]:overflow-visible! [&>div]:w-auto! [&_table]:min-w-full">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="hover:bg-muted">
                                    {headerGroup.headers.map((header, headerIndex) => {
                                        const meta = header.column.columnDef.meta as { width?: string | number } | undefined;
                                        return (
                                            <TableHead
                                                key={header.id}
                                                style={getWidthStyle(meta)}
                                                className={meta?.width ? "wrap-break-word" : ""}
                                            >
                                                {!header.isPlaceholder && (
                                                    headerIndex === 0 && isTreeMode ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="h-5 w-5 shrink-0" />
                                                            <div className="flex items-center">
                                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        flexRender(header.column.columnDef.header, header.getContext())
                                                    )
                                                )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                             {rows.length > 0 ? (
                                rows.map((row) => {
                                    const rowData = row.original as Record<string, unknown>;
                                    const level = isTreeMode && typeof rowData._level === 'number' ? rowData._level : 0;
                                    const hasChildren = isTreeMode && rowData._hasChildren === true;
                                    const rowId = isTreeMode && (rowData._id as string | number) ? (rowData._id as string | number) : row.id;
                                    const isExpanded = isTreeMode && expandedRows.has(rowId);
                                    return (
                                        <Fragment key={row.id}>
                                            <TableRow data-state={row.getIsSelected() && "selected"} className="group/row">
                                                {row.getVisibleCells().map((cell, cellIndex) => {
                                                    const meta = cell.column.columnDef.meta as { width?: string | number } | undefined;
                                                    return (
                                                        <TableCell key={cell.id} style={getWidthStyle(meta)} className={meta?.width ? "wrap-break-word" : ""}>
                                                            {cellIndex === 0 && isTreeMode ? (
                                                                <div style={{ paddingLeft: level > 0 ? `${level * 20}px` : '0' }} className="flex items-center gap-1.5">
                                                                    {hasChildren ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); onToggleRowExpansion(rowId); }}
                                                                            className="h-5 w-5 p-0 hover:bg-accent rounded transition-colors flex items-center justify-center shrink-0"
                                                                        >
                                                                            <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-90")} />
                                                                        </button>
                                                                    ) : <div className="h-5 w-5 shrink-0" />}
                                                                    <div className="flex items-center">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
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
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={mergedColumnsLength} className="h-24 text-center">
                                        {tt('common.no_results')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </ScrollArea>
        </div>
    );
}


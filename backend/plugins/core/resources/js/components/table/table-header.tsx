import { useRef, useState } from "react";
import { TableHeader, TableRow, TableHead } from "@core/components/ui/table";
import { cn } from "@core/lib/utils";
import { flexRender, type Table as ReactTable } from "@tanstack/react-table";
import { GripVertical } from "lucide-react";
import { getWidthStyle } from "./helpers";

const NON_DRAGGABLE_COLUMNS = ['select', 'id', 'actions'];

function arrayMove<T>(array: T[], from: number, to: number): T[] {
    const newArray = [...array];
    const item = newArray.splice(from, 1)[0];
    if (item !== undefined) newArray.splice(to, 0, item);
    return newArray;
}

export function useColumnOrderDrag<TData>(table: ReactTable<TData>) {
    const [columnDragOver, setColumnDragOver] = useState<string | null>(null);
    const columnDragRef = useRef<string | null>(null);

    const handleColumnDragStart = (columnId: string) => {
        columnDragRef.current = columnId;
    };

    const handleColumnDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        setColumnDragOver(columnId);
    };

    const handleColumnDragEnd = () => {
        columnDragRef.current = null;
        setColumnDragOver(null);
    };

    const handleColumnDrop = (targetColumnId: string) => {
        const from = columnDragRef.current;
        if (!from || from === targetColumnId || NON_DRAGGABLE_COLUMNS.includes(targetColumnId)) {
            handleColumnDragEnd();
            return;
        }

        const currentOrder = table.getState().columnOrder;
        const allLeafColumns = table.getAllLeafColumns().map(c => c.id);
        const order = currentOrder.length > 0 ? currentOrder : allLeafColumns;

        const fromIndex = order.indexOf(from);
        const toIndex = order.indexOf(targetColumnId);

        if (fromIndex !== -1 && toIndex !== -1) {
            table.setColumnOrder(arrayMove(order, fromIndex, toIndex));
        }

        handleColumnDragEnd();
    };

    return {
        columnDragRef,
        columnDragOver,
        handleColumnDragStart,
        handleColumnDragOver,
        handleColumnDragEnd,
        handleColumnDrop
    };
}

interface DataTableHeaderProps<TData> {
    table: ReactTable<TData>;
    isTreeMode?: boolean;
    rowSelection: Record<string, boolean>;
}

export function DataTableHeader<TData>({
    table,
    isTreeMode,
    rowSelection,
}: DataTableHeaderProps<TData>) {
    const {
        columnDragRef,
        columnDragOver,
        handleColumnDragStart,
        handleColumnDragOver,
        handleColumnDragEnd,
        handleColumnDrop
    } = useColumnOrderDrag(table);

    return (
        <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-muted">
                    {headerGroup.headers.map((header, i) => {
                        const meta = header.column.columnDef.meta as { width?: string | number } | undefined;
                        const firstDataHeaderIndex = headerGroup.headers.findIndex(h => h.column.id !== 'select');
                        const isTreeColumnHeader = i === (firstDataHeaderIndex !== -1 ? firstDataHeaderIndex : 0) && isTreeMode;
                        const isDragging = columnDragRef.current === header.column.id;
                        const isOver = columnDragOver === header.column.id;
                        const isDraggable = !NON_DRAGGABLE_COLUMNS.includes(header.column.id);

                        // Used for key stability with row selection changes
                        const selectionKeyPart = header.column.id === 'select'
                            ? `-${Object.keys(rowSelection).length}-${JSON.stringify(rowSelection).length}`
                            : '';

                        return (
                            <TableHead
                                key={header.id + selectionKeyPart}
                                style={getWidthStyle(meta)}
                                className={cn(
                                    isDraggable && "cursor-move select-none",
                                    "relative wrap-break-word",
                                    isDragging && "opacity-50 grayscale",
                                    isOver && !isDragging && (
                                        table.getState().columnOrder.indexOf(columnDragRef.current!) < table.getState().columnOrder.indexOf(header.column.id)
                                            ? "border-r-2 border-primary" : "border-l-2 border-primary"
                                    )
                                )}
                                draggable={isDraggable}
                                onDragStart={isDraggable ? () => handleColumnDragStart(header.column.id) : undefined}
                                onDragOver={isDraggable ? (e) => handleColumnDragOver(e, header.column.id) : undefined}
                                onDragEnd={handleColumnDragEnd}
                                onDrop={isDraggable ? () => handleColumnDrop(header.column.id) : undefined}
                            >
                                {!header.isPlaceholder && (
                                    <div className="flex items-center gap-2">
                                        {isDraggable && (
                                            <GripVertical className="w-3 h-3 text-muted-foreground/30" />
                                        )}
                                        {isTreeColumnHeader ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 shrink-0" />
                                                <div className="flex items-center">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </div>
                                            </div>
                                        ) : (
                                            flexRender(header.column.columnDef.header, header.getContext())
                                        )}
                                    </div>
                                )}
                            </TableHead>
                        );
                    })}
                </TableRow>
            ))}
        </TableHeader>
    );
}

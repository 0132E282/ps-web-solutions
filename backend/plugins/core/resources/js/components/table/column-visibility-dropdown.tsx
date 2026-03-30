import { useEffect, useRef, useState } from "react";
import { Table } from "@tanstack/react-table";
import { ChevronDown, Check, GripVertical } from "lucide-react";
import { Button } from "@core/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@core/components/ui/dropdown-menu";
import { tt } from "@core/lib/i18n";
import { cn } from "@core/lib/utils";

const SYSTEM_COLUMNS = ['select', 'actions'];

interface ColumnVisibilityDropdownProps<TData> {
    table: Table<TData>;
    resourceName?: string | null;
}

// Helper to move array item
function arrayMove<T>(arr: T[], from: number, to: number): T[] {
    const next = [...arr];
    const [item] = next.splice(from, 1);
    if (item !== undefined) next.splice(to, 0, item);
    return next;
}

/**
 * Hook to handle table visibility and order persistence in localStorage
 */
function useTablePersistence<TData>(table: Table<TData>, resourceName?: string | null) {
    // Load persisted visibility and order from localStorage on mount
    useEffect(() => {
        if (!resourceName) return;

        // Load Visibility
        const savedVisibility = localStorage.getItem(`table_columns_visibility_${resourceName}`);
        if (savedVisibility) {
            try {
                const visibility = JSON.parse(savedVisibility);
                // Force system columns to always be visible
                SYSTEM_COLUMNS.forEach(col => { visibility[col] = true; });
                table.setColumnVisibility(visibility);
            } catch (e) {
                console.error("Failed to parse saved column visibility", e);
            }
        }

        // Load Order
        const savedOrder = localStorage.getItem(`column_order_${resourceName}`);
        if (savedOrder) {
            try {
                const order = JSON.parse(savedOrder);
                table.setColumnOrder(order);
            } catch (e) {
                console.error("Failed to parse saved column order", e);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resourceName]);

    const saveVisibility = (visibility: Record<string, boolean>) => {
        if (!resourceName) return;
        localStorage.setItem(`table_columns_visibility_${resourceName}`, JSON.stringify(visibility));
    };

    const saveOrder = (order: string[]) => {
        if (!resourceName) return;
        localStorage.setItem(`column_order_${resourceName}`, JSON.stringify(order));
    };

    return { saveVisibility, saveOrder };
}

/**
 * Hook to handle column reordering logic
 */
function useColumnReorder(
    initialOrder: string[],
    onOrderChange: (newOrder: string[]) => void
) {
    const [localOrder, setLocalOrder] = useState<string[]>(initialOrder);
    const dragIndexRef = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Sync localOrder when initialOrder changes
    useEffect(() => {
        setLocalOrder(initialOrder);
    }, [initialOrder.join(',')]);

    const handleDragStart = (index: number) => {
        dragIndexRef.current = index;
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDragEnd = () => {
        dragIndexRef.current = null;
        setDragOverIndex(null);
    };

    const handleDrop = (index: number) => {
        const from = dragIndexRef.current;
        if (from === null || from === index) {
            handleDragEnd();
            return;
        }

        const newOrder = arrayMove(localOrder, from, index);
        setLocalOrder(newOrder);
        onOrderChange(newOrder);
        handleDragEnd();
    };

    return {
        localOrder,
        dragOverIndex,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDrop
    };
}

export function ColumnVisibilityDropdown<TData>({
    table,
    resourceName,
}: ColumnVisibilityDropdownProps<TData>) {
    const { saveVisibility, saveOrder } = useTablePersistence(table, resourceName);

    // Build sorted list of toggleable column ids (excluding system columns)
    const columnOrder = table.getState().columnOrder;
    let allDataColumns = table.getAllColumns().filter(col => !SYSTEM_COLUMNS.includes(col.id));

    if (columnOrder && columnOrder.length > 0) {
        allDataColumns = [...allDataColumns].sort((a, b) => {
            const aIdx = columnOrder.indexOf(a.id);
            const bIdx = columnOrder.indexOf(b.id);
            if (aIdx === -1 && bIdx === -1) return 0;
            if (aIdx === -1) return 1;
            if (bIdx === -1) return -1;
            return aIdx - bIdx;
        });
    }

    const toggleableColumns = allDataColumns.filter(col => {
        const meta = col.columnDef.meta as { enableHiding?: boolean; hidden?: boolean } | undefined;
        return col.getCanHide() && meta?.enableHiding !== false && meta?.hidden !== true;
    });

    const getLabel = (column: any): string => {
        const header = column.columnDef.header;
        if (typeof header === 'string') return header;
        const meta = column.columnDef.meta as { label?: string } | undefined;
        if (meta?.label) return meta.label;
        return column.id;
    };

    const handleToggleVisibility = (column: any) => {
        const isVisible = column.getIsVisible();
        column.toggleVisibility(!isVisible);

        const currentVisibility = table.getState().columnVisibility;
        saveVisibility({ ...currentVisibility, [column.id]: !isVisible });
    };

    const handleOrderChange = (newOrder: string[]) => {
        const currentOrder = table.getState().columnOrder;
        const base = currentOrder.length > 0 ? currentOrder : table.getAllLeafColumns().map(c => c.id);

        // Rebuild: keep system columns at original positions, slot data columns in between
        let dataColCursor = 0;
        const finalOrder = base.map(id => {
            if (SYSTEM_COLUMNS.includes(id)) return id;
            const col = newOrder[dataColCursor++];
            return col ?? id;
        });

        table.setColumnOrder(finalOrder);
        saveOrder(finalOrder);
    };

    const {
        localOrder,
        dragOverIndex,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDrop
    } = useColumnReorder(toggleableColumns.map(c => c.id), handleOrderChange);

    const orderedColumns = localOrder.length === toggleableColumns.length
        ? localOrder.map(id => toggleableColumns.find(c => c.id === id)!).filter(Boolean)
        : toggleableColumns;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto shrink-0">
                    {tt('common.toggle_columns')} <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                {orderedColumns.map((column, index) => (
                    <ColumnVisibilityItem
                        key={column.id}
                        column={column}
                        label={getLabel(column)}
                        isDragOver={dragOverIndex === index}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onDrop={() => handleDrop(index)}
                        onToggle={() => handleToggleVisibility(column)}
                    />
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

interface ColumnVisibilityItemProps {
    column: any;
    label: string;
    isDragOver: boolean;
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onDrop: () => void;
    onToggle: () => void;
}

function ColumnVisibilityItem({
    column,
    label,
    isDragOver,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDrop,
    onToggle,
}: ColumnVisibilityItemProps) {
    return (
        <DropdownMenuItem
            className={cn(
                "flex items-center gap-2 cursor-grab select-none",
                "focus:bg-muted focus:text-foreground",
                "hover:bg-muted hover:text-foreground",
                isDragOver && "bg-muted/70"
            )}
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
            onSelect={(e) => {
                e.preventDefault();
                onToggle();
            }}
        >
            <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            <Check className={cn(
                "h-4 w-4 shrink-0 transition-opacity",
                column.getIsVisible() ? "opacity-100 text-primary" : "opacity-0"
            )} />
        </DropdownMenuItem>
    );
}

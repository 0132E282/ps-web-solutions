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

export function ColumnVisibilityDropdown<TData>({
    table,
    resourceName,
}: ColumnVisibilityDropdownProps<TData>) {
    // Load persisted visibility from localStorage on mount
    useEffect(() => {
        if (!resourceName) return;
        const saved = localStorage.getItem(`table_columns_visibility_${resourceName}`);
        if (!saved) return;
        try {
            const visibility = JSON.parse(saved);
            // Force system columns to always be visible
            SYSTEM_COLUMNS.forEach(col => { visibility[col] = true; });
            table.setColumnVisibility(visibility);
        } catch (e) {
            console.error("Failed to parse saved column visibility", e);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resourceName]);

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

    const getLabel = (column: typeof toggleableColumns[0]): string => {
        const header = column.columnDef.header;
        if (typeof header === 'string') return header;
        const meta = column.columnDef.meta as { label?: string } | undefined;
        if (meta?.label) return meta.label;
        return column.id;
    };

    const handleCheckedChange = (column: typeof toggleableColumns[0], value: boolean) => {
        column.toggleVisibility(value);
        if (!resourceName) return;
        const currentVisibility = table.getState().columnVisibility;
        const nextVisibility = { ...currentVisibility, [column.id]: value };
        localStorage.setItem(`table_columns_visibility_${resourceName}`, JSON.stringify(nextVisibility));
    };

    // Drag state for reordering items in the dropdown
    const [localOrder, setLocalOrder] = useState<string[]>([]);
    const dragIndexRef = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Sync localOrder when toggleableColumns changes
    useEffect(() => {
        setLocalOrder(toggleableColumns.map(c => c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toggleableColumns.map(c => c.id).join(',')]);

    const orderedColumns = localOrder.length === toggleableColumns.length
        ? localOrder.map(id => toggleableColumns.find(c => c.id === id)!).filter(Boolean)
        : toggleableColumns;

    const handleDragStart = (index: number) => {
        dragIndexRef.current = index;
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (index: number) => {
        const from = dragIndexRef.current;
        if (from === null || from === index) {
            dragIndexRef.current = null;
            setDragOverIndex(null);
            return;
        }
        const newOrder = arrayMove(localOrder, from, index);
        setLocalOrder(newOrder);
        dragIndexRef.current = null;
        setDragOverIndex(null);

        // Persist new column order to table state
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
        if (resourceName) {
            localStorage.setItem(`column_order_${resourceName}`, JSON.stringify(finalOrder));
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto shrink-0">
                    {tt('common.toggle_columns')} <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                {orderedColumns.map((column, index) => (
                    <DropdownMenuItem
                        key={column.id}
                        className={cn(
                            "flex items-center gap-2 cursor-grab select-none",
                            "focus:bg-muted focus:text-foreground",
                            "hover:bg-muted hover:text-foreground",
                            dragOverIndex === index && "bg-muted/70"
                        )}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={() => { dragIndexRef.current = null; setDragOverIndex(null); }}
                        onDrop={() => handleDrop(index)}
                        onSelect={(e) => {
                            e.preventDefault();
                            handleCheckedChange(column, !column.getIsVisible());
                        }}
                    >
                        {/* Drag handle */}
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />

                        {/* Label */}
                        <span className="flex-1 truncate">{getLabel(column)}</span>

                        {/* Trailing check icon */}
                        <Check className={cn(
                            "h-4 w-4 shrink-0 transition-opacity",
                            column.getIsVisible() ? "opacity-100 text-primary" : "opacity-0"
                        )} />
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

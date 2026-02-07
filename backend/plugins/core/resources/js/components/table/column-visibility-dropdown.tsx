import { useMemo } from "react";
import { Table } from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import { Button } from "@core/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@core/components/ui/dropdown-menu";
import { tt } from "@core/lib/i18n";

interface ColumnVisibilityDropdownProps<TData> {
    table: Table<TData>;
}

export function ColumnVisibilityDropdown<TData>({
    table,
}: ColumnVisibilityDropdownProps<TData>) {
    const visibleColumns = useMemo(() => {
        return table
            .getAllColumns()
            .filter((column) => {
                const meta = column.columnDef.meta as { enableHiding?: boolean } | undefined;
                return column.getCanHide() && meta?.enableHiding !== false;
            });
    }, [table]);

    const getHeaderTitle = (column: typeof visibleColumns[0]) => {
        const header = column.columnDef.header;
        if (typeof header === 'string') return header;
        return column.id;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto shrink-0">
                    {tt('common.toggle_columns')} <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                {visibleColumns.map((column) => {
                    const headerTitle = getHeaderTitle(column) || column.id;

                    return (
                        <DropdownMenuCheckboxItem
                            key={column.id}
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                            {headerTitle}
                        </DropdownMenuCheckboxItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

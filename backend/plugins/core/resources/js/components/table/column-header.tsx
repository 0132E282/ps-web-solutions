import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff, LucideIcon } from "lucide-react";

import { cn } from "@core/lib/utils";
import { Button } from "@core/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@core/components/ui/dropdown-menu";

interface DataTableColumnHeaderProps<TData, TValue>
    extends React.HTMLAttributes<HTMLDivElement> {
    column: Column<TData, TValue>;
    title: string;
}

interface MenuItem {
    label?: string;
    icon?: LucideIcon;
    onClick?: () => void;
    separator?: boolean;
    show?: boolean;
}

export function DataTableColumnHeader<TData, TValue>({
    column,
    title,
    className,
}: DataTableColumnHeaderProps<TData, TValue>) {
    if (!column.getCanSort()) {
        return <div className={cn(className)}>{title}</div>;
    }

    const menuItems: MenuItem[] = [
        {
            label: "Tăng dần",
            icon: ArrowUp,
            onClick: () => column.toggleSorting(false),
        },
        {
            label: "Giảm dần",
            icon: ArrowDown,
            onClick: () => column.toggleSorting(true),
        },
        {
            separator: true,
            show: column.getCanHide(),
        },
        {
            label: "Ẩn cột",
            icon: EyeOff,
            onClick: () => column.toggleVisibility(false),
            show: column.getCanHide(),
        },
    ];

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="data-[state=open]:bg-accent -ml-3 h-8 hover:bg-transparent"
                    >
                        <span>{title}</span>
                        {column.getIsSorted() === "desc" ? (
                            <ArrowDown className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {menuItems.map((item, index) => {
                        if (item.show === false) return null;

                        if (item.separator) {
                            return <DropdownMenuSeparator key={index} />;
                        }

                        const Icon = item.icon;

                        return (
                            <DropdownMenuItem key={index} onClick={item.onClick}>
                                {Icon && <Icon className="mr-2 h-4 w-4" />}
                                {item.label}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}


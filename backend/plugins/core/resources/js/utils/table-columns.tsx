import { ColumnDef, CellContext, Column, Row, HeaderContext } from "@tanstack/react-table";
import { Badge } from "@core/components/ui/badge";
import { Button } from "@core/components/ui/button";
import { Checkbox } from "@core/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@core/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import * as React from "react";
import { route, getCurrentRouteName } from "@core/lib/route";
import { Link, router } from "@inertiajs/react";
import { tt } from "@core/lib/i18n";
import axios from "axios";
import Toolbar from "@core/components/toolbar/index";

// Import types from centralized location
import type { ColumnMeta } from "@tanstack/react-table";
import type { Admin, BadgeConfig } from "@core/types/table";
// Module augmentation is in types/table.ts (defines ImageConfig, NumberConfig, etc.)
import "@core/types/table";

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const EMPTY_CELL = <span className="text-sm text-muted-foreground">-</span>;

/** Convert index route to update route */
const convertIndexToShowRoute = (routeName: string | null): string | null => {
    return routeName?.endsWith('.index') ? routeName.replace(/\.index$/, '.update') : routeName;
};

/** Get link route from meta configuration */
const getLinkRoute = (link: boolean | string | undefined): string | null => {
    if (!link) return null;
    const currentRoute = link === true ? getCurrentRouteName() : link;
    return typeof currentRoute === "string" ? convertIndexToShowRoute(currentRoute) : currentRoute;
};

/** Get value from row using accessorKey */
const getValue = <TData extends Record<string, unknown>>(
    row: Row<TData>,
    col: Column<TData>,
    accessorKey: string | undefined
) => {
    const key = col.id || accessorKey;
    if (!key) return undefined;

    try {
        const value = row.getValue(key);
        if (value !== undefined) return value;
    } catch {
        // Fallback to direct access
    }

    const rowData = row.original || row;
    return (rowData && typeof rowData === 'object') ? rowData[key] : undefined;
};

/** Get display value from unknown value (object or primitive) */
const getDisplayValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value !== "object") return String(value);

    const obj = value as Record<string, unknown>;
    const candidates = ['name', 'title', 'label', 'full_name', 'email', 'id'];

    for (const key of candidates) {
        if (obj[key] !== undefined && obj[key] !== null) {
            return String(obj[key]);
        }
    }

    return String(value);
};

/** Get translated field label */
const getFieldLabel = (accessorKey: string | undefined, resourceName: string | null): string => {
    if (!accessorKey) return '';
    if (!resourceName) {
        return accessorKey.charAt(0).toUpperCase() + accessorKey.slice(1);
    }
    const fieldKey = `fields.${resourceName}.${accessorKey}`;
    const translated = tt(fieldKey);
    const label = translated !== fieldKey ? translated : accessorKey;
    return label.charAt(0).toUpperCase() + label.slice(1);
};

// ============================================================================
// CELL RENDERERS
// ============================================================================
const createNumberCell = <TData extends Record<string, unknown>>(accessorKey: string | undefined, config: ColumnMeta['numberConfig']) =>
    ({ row, column: col }: CellContext<TData, unknown>) => {
        const value = getValue(row, col, accessorKey);
        if (value == null || value === '') return EMPTY_CELL;

        try {
            const num = Number(value);
            if (isNaN(num)) return <span className="text-sm">{String(value)}</span>;

            const locale = config?.locale || 'vi-VN';
            const options: Intl.NumberFormatOptions = {
                style: config?.format === 'currency' ? 'currency' : (config?.format === 'percent' ? 'percent' : 'decimal'),
                maximumFractionDigits: config?.decimals ?? 2,
            };

            if (config?.format === 'currency') {
                options.currency = config.currency || 'VND';
            }

            const formatter = new Intl.NumberFormat(locale, options);
            return <span className="text-sm font-mono">{formatter.format(num)}</span>;
        } catch {
            return <span className="text-sm">{String(value)}</span>;
        }
    };

const createDateCell = <TData extends Record<string, unknown>>(accessorKey: string | undefined) =>
    ({ row, column: col }: CellContext<TData, unknown>) => {
        const value = getValue(row, col, accessorKey);
        if (value == null) return EMPTY_CELL;
        try {
            const date = new Date(value as string | number | Date);
            if (isNaN(date.getTime())) return EMPTY_CELL;

            const d = String(date.getDate()).padStart(2, '0');
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const y = date.getFullYear();
            const H = String(date.getHours()).padStart(2, '0');
            const M = String(date.getMinutes()).padStart(2, '0');

            return (
                <span className="text-sm text-muted-foreground">
                    {`${d}-${m}-${y} : ${H}:${M}`}
                </span>
            );
        } catch {
            return EMPTY_CELL;
        }
    };

const createImageCell = <TData extends Record<string, unknown>>(accessorKey: string | undefined, config: ColumnMeta['imageConfig']) =>
    ({ row, column: col }: CellContext<TData, unknown>) => {
        let value = getValue(row, col, accessorKey);
        const sizeClasses = { sm: "h-12 w-12", md: "h-14 w-14", lg: "h-18 w-18" };
        const size = sizeClasses[config?.size || "md"];
        const fallback = config?.fallback || "N/A";

        // Extract URL from FileMetadata object if needed
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const obj = value as Record<string, unknown>;
            value = obj.url || obj.path || obj.src || null;
        }

        // Handle array of images (attachments)
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return (
                    <div className={`${size} rounded bg-muted flex items-center justify-center`}>
                        <span className="text-xs text-muted-foreground">{fallback}</span>
                    </div>
                );
            }

            // Show first image for arrays
            const firstImage = value[0];
            const imgUrl = typeof firstImage === 'object'
                ? (firstImage as Record<string, unknown>).url || (firstImage as Record<string, unknown>).path || (firstImage as Record<string, unknown>).src
                : String(firstImage);

            return (
                <div className={`${size} rounded overflow-hidden ${config?.className || ""} relative`}>
                    <img
                        src={String(imgUrl)}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.parentElement) {
                                target.style.display = "none";
                                const fallbackEl = document.createElement("span");
                                fallbackEl.className = "text-xs text-muted-foreground";
                                fallbackEl.textContent = fallback;
                                target.parentElement.appendChild(fallbackEl);
                            }
                        }}
                    />
                    {value.length > 1 && (
                        <div className="absolute bottom-0 right-0 bg-black/60 text-white text-xs px-1 rounded-tl">
                            +{value.length - 1}
                        </div>
                    )}
                </div>
            );
        }

        // Handle empty or invalid value
        if (!value || (typeof value === "string" && !value.trim())) {
            return (
                <div className={`${size} rounded bg-muted flex items-center justify-center`}>
                    <span className="text-xs text-muted-foreground">{fallback}</span>
                </div>
            );
        }

        // Render single image
        return (
            <div className={`${size} rounded overflow-hidden ${config?.className || ""}`}>
                <img
                    src={String(value)}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (config?.fallback && target.parentElement) {
                            target.style.display = "none";
                            const fallbackEl = document.createElement("span");
                            fallbackEl.className = "text-xs text-muted-foreground";
                            fallbackEl.textContent = config.fallback;
                            target.parentElement.appendChild(fallbackEl);
                        }
                    }}
                />
            </div>
        );
    };

const createCheckboxCell = <TData extends Record<string, unknown>>(accessorKey: string | undefined, config: ColumnMeta['checkboxConfig']) =>
    ({ row }: CellContext<TData, unknown>) => {
        const value = getValue(row, { id: accessorKey } as Column<TData>, accessorKey);
        const checked = Boolean(value);
        const disabled = typeof config?.disabled === "function"
            ? config.disabled(row.original)
            : config?.disabled || false;

        return (
            <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={(newChecked) => config?.onCheckedChange?.(!!newChecked, row.original)}
                aria-label="Select"
            />
        );
    };

const createSelectCell = <TData extends Record<string, unknown>>(
    accessorKey: string | undefined,
    options?: Array<{ label: string; value: string | number }>,
    routeName?: string | null
) => {
    const SelectCell = ({ row, column: col }: CellContext<TData, unknown>) => {
        const [isUpdating, setIsUpdating] = React.useState(false);
        const value = getValue(row, col, accessorKey);
        const rowData = row.original as Record<string, unknown>;
        const rowId = rowData.id;

        if (!options || options.length === 0) {
            return value == null || value === '' ? EMPTY_CELL : <span className="text-sm">{String(value)}</span>;
        }

        // If no routeName or rowId, show as read-only badge
        if (!routeName || !rowId) {
            const option = options.find(opt => opt.value === value || String(opt.value) === String(value));
            const label = option?.label || String(value);
            return (
                <Badge variant="secondary" className="text-sm">
                    {label}
                </Badge>
            );
        }

        const handleValueChange = async (newValue: string) => {
            if (!accessorKey || !rowId || !routeName) return;

            setIsUpdating(true);
            try {
                const routeParts = routeName.split('.');
                routeParts[routeParts.length - 1] = 'update';
                const updateRouteName = routeParts.join('.');

                await axios.patch(route(updateRouteName, { id: rowId }), { [accessorKey]: newValue });
                router.reload({ only: ['items', 'data'] });
            } catch (error) {
                console.error('Error updating field:', error);
            } finally {
                setIsUpdating(false);
            }
        };

        const currentValue = value != null ? String(value) : '';
        const hasValidValue = options.some(opt => String(opt.value) === currentValue);

        return (
            <Select
                value={hasValidValue ? currentValue : ''}
                onValueChange={handleValueChange}
                disabled={isUpdating}
            >
                <SelectTrigger className="h-8 w-[140px] text-sm">
                    <SelectValue placeholder="Chọn..." />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={String(option.value)} value={String(option.value)}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    };

    return SelectCell;
};

const createBadgeCell = <TData extends Record<string, unknown>>(accessorKey: string | undefined, meta: ColumnMeta) =>
    ({ row, column: col }: CellContext<TData, unknown>) => {
        const value = getValue(row, col, accessorKey);
        const config: BadgeConfig = meta.badgeConfig || {};
        const isMultiple = meta.multiple === true;

        if (Array.isArray(value)) {
            if (value.length === 0) {
                return <span className="text-sm text-muted-foreground">{config.falseLabel || "Chưa có"}</span>;
            }
            return isMultiple ? (
                <div className="flex flex-wrap gap-1">
                    {value.map((item, i) => (
                        <Badge key={i} variant={config.trueVariant || "default"} className={config.className}>{getDisplayValue(item)}</Badge>
                    ))}
                </div>
            ) : (
                <Badge variant={config.trueVariant || "default"} className={config.className}>{getDisplayValue(value[0])}</Badge>
            );
        }

        if (value == null) {
            return <Badge variant={config.falseVariant || "secondary"} className={config.className}>{config.falseLabel || "Chưa xác thực"}</Badge>;
        }

        const isTruthy = typeof value === "boolean" ? value : (typeof value === "string" && value);
        return (
            <Badge variant={isTruthy ? (config.trueVariant || "default") : (config.falseVariant || "secondary")} className={config.className}>
                {isTruthy ? (config.trueLabel || "Đã xác thực") : (config.falseLabel || "Chưa xác thực")}
            </Badge>
        );
    };

const wrapWithLink = <TData extends Record<string, unknown>>(
    cell: ColumnDef<TData>['cell'],
    linkRoute: string | null,
    idKey: string
): ColumnDef<TData>['cell'] => {
    if (!linkRoute || typeof cell !== "function") return cell;

    return ({ row, ...rest }: CellContext<TData, unknown>) => {
        const rowData = row.original as Record<string, unknown>;
        const cellContent = cell({ row, ...rest } as CellContext<TData, unknown>);

        if (!rowData[idKey]) return cellContent;

        if (React.isValidElement(cellContent)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((cellContent.type as any) === Link || cellContent.type === 'a' || (cellContent.props as { href?: string })?.href) {
                return cellContent;
            }
        }

        return (
            <Link href={route(linkRoute, { [idKey]: rowData[idKey] })} className="tesxt-sm hover:text-primary ">
                {cellContent}
            </Link>
        );
    };
};



export function fieldsToColumns<TData extends Record<string, unknown>>(fields: (Record<string, unknown> | string)[], resourceName?: string | null): ColumnDef<TData>[] {
    const columns = fields.map((field) => {
        // Normalize field to object format
        const fieldConfig = typeof field === 'string' ? { name: field } : field;

        // Extract accessor key from various possible property names
        const accessor = (fieldConfig.name || fieldConfig.accessorKey || fieldConfig.key || fieldConfig.field) as string;
        if (!accessor) return null;

        // Destructure to separate known properties from custom ones
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { name, key, accessorKey: _accessor, field: _field, sortable, header, id, ...restProps } = fieldConfig;

        // Map sortable to sort for backward compatibility
        if (sortable !== undefined) {
            restProps.sort = sortable;
        }

        // Determine column ID and header
        const columnId = id ? String(id) : accessor;
        const columnHeader = header
            ? (typeof header === 'string' ? header : String(header))
            : getFieldLabel(accessor, resourceName || null);

        return {
            accessorKey: accessor,
            id: columnId,
            header: columnHeader,
            ...restProps
        } as ColumnDef<TData>;
    }).filter(Boolean) as ColumnDef<TData>[];

    // Priority 1: Check for explicit primary: true
    const getCol = (col: ColumnDef<TData>) => col as unknown as Record<string, unknown>;
    let hasPrimary = columns.some(col => getCol(col).primary);

    // Priority 2: If no explicit primary, check for 'title' or 'name'
    if (!hasPrimary) {
        const titleCol = columns.find(col => {
            const key = getCol(col).accessorKey;
            return key === 'title' || key === 'name';
        });

        if (titleCol) {
            (titleCol as unknown as Record<string, unknown>).primary = true;
            hasPrimary = true;
        }
    }

    // Priority 3: If no primary found, set the first column as primary
    if (!hasPrimary && columns.length > 0) {
        const firstCol = columns[0];
        if (firstCol) {
            (firstCol as unknown as Record<string, unknown>).primary = true;
        }
    }

    // Process columns to add cell renderers, sorting, etc.
    return processColumns(columns, resourceName, null);
}

export function processColumns<TData extends Record<string, unknown>>(
    columns: ColumnDef<TData>[],
    resourceName?: string | null,
    routeName?: string | null
): ColumnDef<TData>[] {
    return columns.map((column) => {
        // Access column properties through generic record type
        const columnProps = column as unknown as Record<string, unknown>;
        const accessor = columnProps.accessorKey as string | undefined;
        let processed: ColumnDef<TData> = { ...column };

        // Auto-translate header if needed
        if (accessor && resourceName) {
            if (!column.header || (typeof column.header === "string" && column.header === accessor)) {
                processed.header = getFieldLabel(accessor, resourceName);
            }
        }

        // Apply size configuration for both TanStack Table and DOM rendering
        if (columnProps.size !== undefined) {
            const sizeValue = typeof columnProps.size === 'number'
                ? columnProps.size
                : parseInt(String(columnProps.size), 10);

            processed.size = sizeValue;
            processed.meta = {
                ...(processed.meta || {}),
                width: sizeValue
            } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        }

        // Handle sortable columns
        if (columnProps.sort) {
            const sortAccessor = (columnProps.sortAccessorKey || accessor) as string;
            const headerText = typeof column.header === "string" ? column.header
                : typeof processed.header === "string" ? processed.header
                : resourceName ? getFieldLabel(sortAccessor, resourceName) : sortAccessor || '';
            const iconPosition = columnProps.iconPosition || "left";
            const headerIcon = columnProps.icon as React.ReactNode;

            const sortableColumn: Partial<ColumnDef<TData>> = {
                ...processed,
                enableSorting: true,
                header: ({ column: c }) => (
                    <Button variant="ghost" onClick={() => c.toggleSorting(c.getIsSorted() === "asc")} className="h-8 px-2 lg:px-3">
                        {iconPosition === "left" && headerIcon && <span className="mr-2">{headerIcon}</span>}
                        {headerText}
                        {iconPosition === "right" && headerIcon && <span className="ml-2">{headerIcon}</span>}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
            };

            processed = (columnProps.sortAccessorKey
                ? { ...sortableColumn, accessorFn: (row: TData) => (row as Record<string, unknown>)[columnProps.sortAccessorKey as string] as unknown }
                : { ...sortableColumn, accessorKey: accessor as string }
            ) as ColumnDef<TData>;
        }
        // Handle columns with icon but no sorting
        else if (columnProps.icon && typeof column.header === "string") {
            const iconPosition = columnProps.iconPosition || "left";
            const headerIcon = columnProps.icon as React.ReactNode;
            const headerText = (column.header === accessor && resourceName)
                ? getFieldLabel(accessor as string, resourceName)
                : column.header;

            processed = {
                ...processed,
                header: () => (
                    <div className="flex items-center gap-2">
                        {iconPosition === "left" && headerIcon}
                        {headerText}
                        {iconPosition === "right" && headerIcon}
                    </div>
                ),
            } as ColumnDef<TData>;
        }

        // Handle custom sort accessor without sort property
        if (columnProps.sortAccessorKey && !columnProps.sort && !(processed as unknown as Record<string, unknown>).accessorFn) {
            processed = {
                ...processed,
                accessorFn: (row: TData) => (row as Record<string, unknown>)[columnProps.sortAccessorKey as string] as unknown,
                enableSorting: processed.enableSorting !== false,
            };
        }

        // Map of cell renderer creators by type
        const cellRenderers: Record<string, () => ColumnDef<TData>['cell']> = {
            date: () => createDateCell(accessor),
            attachment: () => createImageCell(accessor, columnProps.imageConfig as ColumnMeta['imageConfig']),
            attachments: () => createImageCell(accessor, columnProps.imageConfig as ColumnMeta['imageConfig']),
            checkbox: () => createCheckboxCell(accessor, columnProps.checkboxConfig as ColumnMeta['checkboxConfig']),
            badge: () => createBadgeCell(accessor, columnProps as unknown as ColumnMeta),
            select: () => createSelectCell(accessor, columnProps.options as Array<{label: string; value: string | number}>, routeName),
            number: () => createNumberCell(accessor, columnProps.numberConfig as ColumnMeta['numberConfig']),
        };

        // Apply cell renderer based on ui then type or use default
        const cellType = (columnProps.ui || columnProps.type) as string | undefined;
        if (cellType && cellRenderers[cellType]) {
            processed.cell = cellRenderers[cellType]();
        } else if (!processed.cell) {
            // Default cell renderer for text values with 2-line truncation
            processed.cell = ({ row, column: c }) => {
                const value = getValue(row, c, accessor);
                return value == null || value === ''
                    ? EMPTY_CELL
                    : <span className="text-sm line-clamp-2">{getDisplayValue(value)}</span>;
            };
        }

        // Auto-enable link for primary columns
        if (columnProps.primary && !columnProps.link) {
            (columnProps as Record<string, unknown>).link = true;
        }

        // Wrap cell content with link if configured
        if (columnProps.link) {
            const linkIdKey = (columnProps.linkIdKey as string) || "id";
            processed.cell = wrapWithLink(
                processed.cell,
                getLinkRoute(columnProps.link as string | boolean | undefined),
                linkIdKey
            );
        }

        return processed;
    });
}

// ============================================================================
// BASE COLUMNS
// ============================================================================

export const baseColumns: ColumnDef<Admin>[] = [
    {
        id: "id",
        accessorKey: "id",
        size: 120,
        header: ({ table }: HeaderContext<Admin, unknown>) => {
            return (
                <div className="group/header" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() && "indeterminate")
                        }
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                        className="border-muted-foreground"
                    />
                </div>
            );
        },
        cell: ({ row }) => {
            const isSelected = row.getIsSelected();
            return (
                <div className="flex items-center gap-2 group/id-cell">
                    <div className="relative w-5 h-5 flex items-center justify-center">
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Select row"
                            className={`absolute transition-opacity duration-200 ${
                                isSelected
                                    ? "opacity-100"
                                    : "opacity-0 group-hover/row:opacity-100"
                            }`}
                        />
                        <span
                            className={`font-mono text-sm transition-opacity duration-200 ${
                                isSelected
                                    ? "opacity-0"
                                    : "opacity-100 group-hover/row:opacity-0"
                            }`}
                        >
                            #
                        </span>
                    </div>
                    <span className="font-mono text-sm">{row.getValue("id")}</span>
                </div>
            );
        },
        enableHiding: false,
    },
    {
        id: "actions",
        header: () => "",
        enableHiding: false,
        cell: ({ row }) => <Toolbar form="row" props={{ row: row.original as unknown as Record<string, unknown> & { id?: number | string } }} />,
    },
];

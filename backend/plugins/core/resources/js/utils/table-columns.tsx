import Toolbar from "@core/components/toolbar/index";
import { Badge } from "@core/components/ui/badge";
import { Button } from "@core/components/ui/button";
import { Checkbox } from "@core/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@core/components/ui/select";
import { tt } from "@core/lib/i18n";
import { getCurrentRouteName, route } from "@core/lib/route";
import type { Admin } from "@core/types/table";
import "@core/types/table";
import { Link, router } from "@inertiajs/react";
import type { CellContext, Column, ColumnDef, Row, ColumnMeta } from "@tanstack/react-table";
import axios from "axios";
import { ArrowUpDown, Image } from "lucide-react";
import * as React from "react";

/**
 * Constants & Types
 */
const EMPTY_CELL = <span className="text-sm text-muted-foreground">-</span>;

const MEDIA_SIZES = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-16 w-16",
} as const;

type BaseData = Record<string, unknown>;
type CellRenderer<TData extends BaseData = BaseData> = (props: CellContext<TData, unknown>) => React.ReactNode;
type RendererFactory = (key?: string, cfg?: unknown, extra?: unknown) => CellRenderer<BaseData>;

type ExtendedColumnDef<TData extends BaseData = BaseData> = ColumnDef<TData> & {
    accessorKey?: string;
    sort?: boolean;
    sortAccessorKey?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    ui?: string;
    type?: string;
    primary?: boolean;
    link?: boolean | string;
    linkIdKey?: string;
    size?: number | string;
    imageConfig?: ColumnMeta['imageConfig'];
    checkboxConfig?: ColumnMeta['checkboxConfig'];
    numberConfig?: ColumnMeta['numberConfig'];
    options?: Array<{ label: string; value: string | number }>;
};

/**
 * Private Helpers
 */

const getCellValue = <TData extends BaseData>(row: Row<TData>, columnId?: string): unknown => {
    if (!columnId) return undefined;
    try {
        const val = row.getValue(columnId);
        if (val !== undefined) return val;
    } catch { /* Fallback */ }
    return (row.original as BaseData)[columnId];
};

const formatDisplayValue = (val: unknown): string => {
    if (val == null) return "";
    if (typeof val !== "object") return String(val);
    const obj = val as BaseData;
    const priorityKeys = ['name', 'title', 'label', 'full_name', 'email', 'id'];
    const foundKey = priorityKeys.find(k => obj[k] != null);
    return foundKey ? String(obj[foundKey]) : JSON.stringify(val);
};

const resolveFieldLabel = (key?: string, resource?: string | null): string => {
    if (!key) return '';
    const langKey = resource ? `fields.${resource}.${key}` : `fields.${key}`;
    const translated = tt(langKey);
    const final = translated === langKey ? key : translated;
    return final.charAt(0).toUpperCase() + final.slice(1);
};

const getEffectiveRoute = (link: boolean | string | undefined): string | null => {
    if (!link) return null;
    const name = link === true ? getCurrentRouteName() : link;
    if (typeof name !== 'string') return null;
    return name.endsWith('.index') ? name.replace(/\.index$/, '.update') : name;
};

/**
 * Cell Components
 */

const MediaCell: React.FC<{ urls: unknown[], size: keyof typeof MEDIA_SIZES, className?: string }> = ({ urls, size, className }) => {
    const cls = `${MEDIA_SIZES[size] || MEDIA_SIZES.md} rounded border bg-muted overflow-hidden relative group flex-shrink-0 ${className || ""}`;
    const IconFallback = <div className={`${cls} flex items-center justify-center text-muted-foreground/40`}><Image className="h-1/2 w-1/2" /></div>;

    if (!urls.length) return IconFallback;

    return (
        <div className={cls}>
            <img
                src={String(urls[0])}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                onError={e => {
                    const el = e.currentTarget;
                    const p = el.parentElement;
                    if (!p) return;
                    el.remove();
                    p.innerHTML = `<div class="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground/40">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-1/2 w-1/2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    </div>`;
                }}
            />
            {urls.length > 1 && (
                <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] px-1 font-bold rounded-tl">
                    +{urls.length - 1}
                </div>
            )}
        </div>
    );
};

/**
 * Cell Render Factories
 */

const RENDERERS: Record<string, RendererFactory> = {
    number: (key, cfg) => {
        const config = cfg as ColumnMeta['numberConfig'];
        return ({ row }) => {
            const val = getCellValue(row, key);
            if (val == null || val === '') return EMPTY_CELL;
            const num = Number(val);
            if (isNaN(num)) return <span className="text-sm">{String(val)}</span>;
            return (
                <span className="text-sm font-mono">
                    {new Intl.NumberFormat(config?.locale || 'vi-VN', {
                        style: config?.format === 'currency' ? 'currency' : (config?.format === 'percent' ? 'percent' : 'decimal'),
                        currency: config?.currency || 'VND',
                        maximumFractionDigits: config?.decimals ?? 2,
                    }).format(num)}
                </span>
            );
        };
    },

    date: (key) => ({ row }) => {
        const val = getCellValue(row, key);
        if (!val) return EMPTY_CELL;
        const d = new Date(val as string | number | Date);
        if (isNaN(d.getTime())) return EMPTY_CELL;
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatted = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} : ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        return <span className="text-sm text-muted-foreground">{formatted}</span>;
    },

    media: (key, cfg) => {
        const config = cfg as ColumnMeta['imageConfig'];
        return ({ row }) => {
            const raw = getCellValue(row, key);
            const urls = (Array.isArray(raw) ? raw : [raw]).map(v => (v && typeof v === 'object' ? (v as BaseData).url || (v as BaseData).path || (v as BaseData).src : v)).filter(Boolean);
            return <MediaCell urls={urls} size={config?.size || 'md'} className={config?.className} />;
        };
    },

    checkbox: (key, cfg) => {
        const config = cfg as ColumnMeta['checkboxConfig'];
        return ({ row }) => (
            <Checkbox
                checked={Boolean(getCellValue(row, key))}
                disabled={typeof config?.disabled === 'function' ? config.disabled(row.original) : !!config?.disabled}
                onCheckedChange={v => config?.onCheckedChange?.(!!v, row.original)}
            />
        );
    },

    select: (key, options, routeName) => {
        const opts = (options as Array<{ label: string; value: string | number }>) || [];
        const rName = routeName as string | null | undefined;
        return ({ row }) => {
            const [updating, setUpdating] = React.useState(false);
            const val = getCellValue(row, key);
            const id = (row.original as BaseData).id;

            if (!opts.length) return val == null || val === '' ? EMPTY_CELL : <span className="text-sm">{String(val)}</span>;
            if (!rName || !id) {
                const label = opts.find(o => String(o.value) === String(val))?.label || String(val);
                return <Badge variant="secondary" className="text-sm">{label}</Badge>;
            }

            const handleChange = async (newVal: string) => {
                if (!key || !id) return;
                setUpdating(true);
                try {
                    const updateRoute = rName.split('.').slice(0, -1).join('.') + '.update';
                    await axios.patch(route(updateRoute, { id: String(id) }), { [key]: newVal });
                    router.reload({ only: ['items', 'data'] });
                } finally {
                    setUpdating(false);
                }
            };

            return (
                <Select value={String(val ?? '')} onValueChange={handleChange} disabled={updating}>
                    <SelectTrigger className="h-8 w-[140px] text-sm">
                        <SelectValue placeholder="Chọn..." />
                    </SelectTrigger>
                    <SelectContent>
                        {opts.map(o => (
                            <SelectItem key={String(o.value)} value={String(o.value)}>{o.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        };
    },

    badge: (key, cfg) => {
        const meta = cfg as ColumnMeta;
        const config = meta?.badgeConfig || {};
        return ({ row }) => {
            const val = getCellValue(row, key);
            if (Array.isArray(val)) {
                return val.length ? (
                    <div className="flex flex-wrap gap-1">
                        {val.map((item, i) => (
                            <Badge key={i} variant={config.trueVariant || "default"} className={config.className}>
                                {formatDisplayValue(item)}
                            </Badge>
                        ))}
                    </div>
                ) : <span className="text-sm text-muted-foreground">{config.falseLabel || "Chưa có"}</span>;
            }
            const active = !!val;
            return (
                <Badge variant={active ? (config.trueVariant || "default") : (config.falseVariant || "secondary")} className={config.className}>
                    {active ? (config.trueLabel || "Đã xác thực") : (config.falseLabel || "Chưa xác thực")}
                </Badge>
            );
        };
    }
};

/**
 * Wrappers & Modifiers
 */

const withLink = <TData extends BaseData>(
    cell: ColumnDef<TData>['cell'],
    routeName: string | null,
    idKey: string
): ColumnDef<TData>['cell'] => {
    if (!routeName || typeof cell !== 'function') return cell;

    return (props: CellContext<TData, unknown>) => {
        const content = cell(props);
        const id = (props.row.original as BaseData)[idKey];
        if (!id) return content;

        if (React.isValidElement(content)) {
            const type = content.type as string | React.ComponentType | { displayName?: string };
            const isLink = (typeof type === 'function' && 'displayName' in (type as object) && (type as { displayName: string }).displayName === 'Link') ||
                          (typeof type === 'object' && type !== null && 'displayName' in type && type.displayName === 'Link');
            if (isLink || (content.props as { href?: string }).href) return content;
        }

        return (
            <Link href={route(routeName, { [idKey]: String(id) })} className="hover:text-primary transition-colors">
                {content}
            </Link>
        );
    };
};

/**
 * Public Exported Collections
 */

export const baseColumns: ColumnDef<Admin>[] = [
    {
        id: "select",
        size: 80,
        header: ({ table }) => {
            const rows = table.getRowModel().rows;
            const isAll = rows.length > 0 && rows.every(r => r.getIsSelected());
            const isSome = !isAll && rows.some(r => r.getIsSelected());
            return (
                <Checkbox
                    checked={isAll ? true : (isSome ? "indeterminate" : false)}
                    onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
                    aria-label="Select all"
                />
            );
        },
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={v => row.toggleSelected(!!v)}
                />
                <span className="text-sm font-medium">{(row.original as unknown as BaseData).id as string | number}</span>
            </div>
        ),
        enableSorting: false,
    },
    {
        id: "actions",
        enableSorting: false,
        cell: ({ row }) => <Toolbar form="row" props={{ row: row.original as unknown as Record<string, unknown> }} />,
    },
];

/**
 * Main Entry Points
 */

export function processColumns<TData extends BaseData>(
    columns: ColumnDef<TData>[],
    resource?: string | null,
    routeName?: string | null
): ColumnDef<TData>[] {
    return columns.map(col => {
        const p = col as ExtendedColumnDef<TData>;
        const key = p.accessorKey;
        const result = { ...col } as unknown as ExtendedColumnDef<TData> & Record<string, unknown>;

        if (key && resource && (!col.header || col.header === key)) {
            result.header = resolveFieldLabel(key, resource);
        }

        if (p.size) {
            result.size = Number(p.size);
            result.meta = { ...((result.meta as Record<string, unknown>) || {}), width: Number(p.size) };
        }

        if (p.sort) {
            const sortKey = p.sortAccessorKey || key;
            const title = typeof result.header === 'string' ? result.header : resolveFieldLabel(sortKey, resource);
            result.enableSorting = true;
            result.header = (({ column: c }: { column: Column<TData, unknown> }) => (
                <Button variant="ghost" onClick={() => c.toggleSorting(c.getIsSorted() === "asc")} className="h-8 px-2 lg:px-3">
                    {p.iconPosition !== 'right' && p.icon && <span className="mr-2">{p.icon}</span>}
                    {title}
                    {p.iconPosition === 'right' && p.icon && <span className="ml-2">{p.icon}</span>}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )) as ColumnDef<TData>['header'];
            if (p.sortAccessorKey) result.accessorFn = (r: TData) => (r as BaseData)[p.sortAccessorKey as string];
        } else if (p.icon && typeof result.header === 'string') {
            const h = result.header as string;
            result.header = () => (
                <div className="flex items-center gap-2">
                    {p.iconPosition !== 'right' && p.icon}
                    {h}
                    {p.iconPosition === 'right' && p.icon}
                </div>
            );
        }

        const rawType = (p.ui || p.type) as string;
        const typeMapping: Record<string, string> = { attachment: 'media', attachments: 'media', image: 'media' };
        const type = typeMapping[rawType] || rawType;
        const factory = RENDERERS[type];

        if (factory) {
            const config = p.imageConfig || p.checkboxConfig || p.numberConfig || p.options || p;
            result.cell = factory(key, config, routeName) as ColumnDef<TData>['cell'];
        } else if (!result.cell) {
            result.cell = (({ row }) => {
                const v = getCellValue(row, key);
                return v == null || v === '' ? EMPTY_CELL : <span className="text-sm line-clamp-2">{formatDisplayValue(v)}</span>;
            }) as ColumnDef<TData>['cell'];
        }

        if (p.primary && !p.link) p.link = true;
        if (p.link) {
            result.cell = withLink(result.cell, getEffectiveRoute(p.link), p.linkIdKey || "id");
        }

        return result;
    });
}

export function fieldsToColumns<TData extends BaseData>(
    fields: (Record<string, unknown> | string)[],
    resource?: string | null
): ColumnDef<TData>[] {
    const rawCols = fields.map(f => {
        const cfg = typeof f === 'string' ? { name: f } : (f as Record<string, unknown>);
        const accessor = (cfg.name || cfg.accessorKey || cfg.key || cfg.field) as string;
        if (!accessor) return null;
        const { sortable, header, id, ...rest } = cfg;
        return {
            accessorKey: accessor,
            id: (id as string) || accessor,
            header: (header as string) || resolveFieldLabel(accessor, resource),
            sort: sortable as boolean | undefined,
            ...rest
        } as ExtendedColumnDef<TData>;
    }).filter((f): f is ExtendedColumnDef<TData> => f !== null);

    if (rawCols.length) {
        let primary = rawCols.find(c => c.primary);
        if (!primary) primary = rawCols.find(c => ['title', 'name'].includes(c.accessorKey || '')) || rawCols[0];
        if (primary) primary.primary = true;
    }

    return processColumns(rawCols as ColumnDef<TData>[], resource, null);
}

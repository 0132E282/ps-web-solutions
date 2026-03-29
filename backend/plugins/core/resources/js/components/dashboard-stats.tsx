import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@core/lib/utils";
import * as LucideIcons from "lucide-react";

export interface DashboardStatItem {
    title: string;
    value?: number | string | null;
    ui?: {
        icon?: string;
        class?: string;
    };
    icon?: string;
    color?: string;
    prefix?: string;
    suffix?: string;
    query?: Record<string, unknown>;
}

interface DashboardStatsProps {
    items: DashboardStatItem[];
    className?: string;
    onItemClick?: (item: DashboardStatItem) => void;
    activeItem?: DashboardStatItem | null;
}

const COLORS = [
    { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", value: "text-blue-700 dark:text-blue-300" },
    { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", value: "text-emerald-700 dark:text-emerald-300" },
    { bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800", value: "text-violet-700 dark:text-violet-300" },
    { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", value: "text-amber-700 dark:text-amber-300" },
    { bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-800", value: "text-rose-700 dark:text-rose-300" },
    { bg: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-200 dark:border-cyan-800", value: "text-cyan-700 dark:text-cyan-300" },
];

const DEFAULT_PALETTE = COLORS[0]!;

function StatCard({ item, index, onClick, isActive }: { item: DashboardStatItem; index: number; onClick?: (item: DashboardStatItem) => void; isActive?: boolean }) {
    const palette = COLORS[index % COLORS.length] ?? DEFAULT_PALETTE;
    const displayValue = item.value === null || item.value === undefined ? "—" : item.value;

    const iconName = item.ui?.icon || item.icon;
    const customClass = item.ui?.class || item.color;

    // Resolve icon if it's a valid Lucide icon name
    const IconComponent = iconName && (LucideIcons as any)[iconName[0]?.toUpperCase() + iconName.slice(1)];

    return (
        <div
            onClick={() => onClick?.(item)}
            className={cn(
                "flex flex-col gap-3 rounded-2xl border border-transparent px-6 py-4 w-full transition-all duration-300 group relative overflow-hidden",
                onClick ? "cursor-pointer active:scale-[0.98]" : "",
                !customClass && palette.bg,
                customClass,
                isActive && [
                    "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-xl scale-105 z-20",
                    !customClass ? palette.border : (customClass.includes('border-') ? "" : "border-white/40")
                ]
            )}
        >
            {/* Ambient Background Glow for custom colors */}
            {customClass && (
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl transition-transform group-hover:scale-150" />
            )}
            
            {/* Active Indicator Dot */}
            {isActive && (
                <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary animate-pulse z-20" />
            )}

            <div className="flex items-start justify-between gap-3 relative z-10">
                <p className={cn(
                    "text-[11px] uppercase tracking-wider font-bold transition-colors",
                    !customClass 
                        ? "text-muted-foreground" 
                        : (customClass.includes('text-') ? "" : "text-white/70")
                )}>
                    {item.title}
                </p>
                {IconComponent && (
                    <div className={cn(
                        "transition-all duration-300",
                        !customClass 
                            ? "text-muted-foreground" 
                            : "text-white/80"
                    )}>
                        <IconComponent className="h-4 w-4" />
                    </div>
                )}
            </div>

            <div className="mt-auto relative z-10">
                <p className={cn(
                    "text-3xl font-bold tracking-tight tabular-nums flex items-baseline gap-1",
                    !customClass 
                        ? palette.value 
                        : (customClass.includes('text-') ? "" : "text-white")
                )}>
                    {item.prefix && <span className="text-lg font-medium opacity-70">{item.prefix}</span>}
                    {typeof displayValue === "number" ? displayValue.toLocaleString() : displayValue}
                    {item.suffix && <span className="text-lg font-medium opacity-70">{item.suffix}</span>}
                </p>
            </div>
        </div>
    );
}

export function DashboardStats({ items, className, onItemClick, activeItem }: DashboardStatsProps) {
    const [target, setTarget] = React.useState<HTMLElement | null>(null);

    React.useEffect(() => {
        setTarget(document.getElementById("page-dashboard"));
    }, []);

    if (!items.length) return null;

    const content = (
        <div
            className={cn(
                "w-full",
                className,
            )}
        >
            <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-4 py-4 max-w-7xl"
            >
                {items.map((item, i) => (
                    <StatCard
                        key={i}
                        item={item}
                        index={i}
                        onClick={onItemClick}
                        isActive={activeItem === item}
                    />
                ))}
            </div>
        </div>
    );

    return target ? createPortal(content, target) : content;
}

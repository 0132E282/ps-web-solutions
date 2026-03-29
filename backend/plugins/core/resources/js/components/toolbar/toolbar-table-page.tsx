import * as React from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Download, Upload, Copy } from "lucide-react";
import { Button } from "@core/components/ui/button";
import { cn } from "@core/lib/utils";
import { route } from "@core/lib/route";
import { Link } from "@inertiajs/react";
import { tt } from "@core/lib/i18n";
import { tableRegistry } from "@core/components/table/table-registry";
import type { Table } from "@tanstack/react-table";
import { useModule } from "@core/hooks/use-module";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@core/redux/store";
import LocaleSwitcher from "@core/components/locale-switcher";
import { bulkDeleteResourceRequest, bulkDuplicateResourceRequest } from "../../redux/slices/resourceSlice";
import { ConfirmDialog, ExportDialog, ImportDialog } from "@core/components/dialogs";
import { DashboardStats, type DashboardStatItem } from "@core/components/dashboard-stats";
import { router } from "@inertiajs/react";
import { encodeFilters } from "../table/helpers";

// ==============================================================================
// Types
// ==============================================================================
interface TabNav { label: string; api?: string; route?: string; onClick?: () => void; active?: boolean; }
interface ImportType { value: string; label: string; }
interface TableRowData { id?: string | number; [key: string]: unknown; }
interface ToolbarProps {
    ui?: "table" | "tree" | "form"; variant?: "page" | "toolbar"; className?: string;
    actions?: { create?: boolean | string; delete?: boolean | string; destroy?: boolean | string; export?: boolean | string; import?: boolean | string; duplicate?: boolean | string; [key: string]: unknown; };
    create?: boolean | string; delete?: boolean | string; export?: boolean | string; import?: boolean | string; duplicate?: boolean | string;
    onCreate?: () => void; onDelete?: () => void | Promise<void>;
    onExport?: (columns?: string[], format?: 'xlsx' | 'csv', filter?: string, exportRelated?: boolean) => void | Promise<void>;
    onImport?: (file: File, fileType?: 'xlsx' | 'csv', importType?: string) => void | Promise<void>;
    onDuplicate?: () => void | Promise<void>; getIdFromRow?: (row: TableRowData) => string | number;
    deleteRoute?: string; exportRoute?: string; importRoute?: string; duplicateRoute?: string; importTemplateRoute?: string;
    importTypes?: ImportType[]; tabnavs?: TabNav[]; layouts?: string[];
    viewMode?: string; onViewModeChange?: (mode: string) => void; locale?: boolean;
}
// ==============================================================================
// Utilities
// ==============================================================================
const resolveRoute = (prop: boolean | string | undefined, fallback: string | null): string | null => {
    if (prop === false) return null;
    return typeof prop === 'string' ? prop : fallback;
};

// ==============================================================================
// Custom Hooks
// ==============================================================================
// * DRY: Tách phần logic quan lý table instance ra một hook riêng
function useTableInstance(currentRouteName: string | null) {
    const [tableInstance, setTableInstance] = React.useState<Table<TableRowData> | null>(null);
    const [selectedCount, setSelectedCount] = React.useState(0);

    React.useEffect(() => {
        const findTable = () => {
            const table = currentRouteName ? tableRegistry.getByRoute<TableRowData>(currentRouteName) : tableRegistry.get<TableRowData>();
            if (table) setTableInstance(table);
        };
        findTable();
        const timeout = setTimeout(findTable, 100);
        const interval = setInterval(findTable, 200);
        return () => { clearTimeout(timeout); clearInterval(interval); };
    }, [currentRouteName]);

    React.useEffect(() => {
        const updateSelectedCount = () => {
            if (!tableInstance) return setSelectedCount(0);
            try {
                const count = tableInstance.getFilteredSelectedRowModel().rows.length;
                if (count !== selectedCount) setSelectedCount(count);
            } catch {
                if (selectedCount !== 0) setSelectedCount(0);
            }
        };
        updateSelectedCount();
        const interval = setInterval(updateSelectedCount, 100);
        return () => clearInterval(interval);
    }, [tableInstance, selectedCount]);

    const getSelectedRows = React.useCallback((): TableRowData[] => {
        if (!tableInstance) return [];
        try { return tableInstance.getFilteredSelectedRowModel().rows.map(row => row.original); } catch { return []; }
    }, [tableInstance]);

    return { tableInstance, selectedCount, getSelectedRows };
}

// ==============================================================================
// Main Toolbar Component
// ==============================================================================
const Toolbar = ({
    ui, variant = "toolbar", className = "", actions, create: createProp, delete: deletePropVal,
    export: exportPropVal, import: importPropVal, duplicate: duplicatePropVal, onCreate, onDelete,
    onExport, onImport, onDuplicate, getIdFromRow = (row: TableRowData) => row?.id ?? '', deleteRoute: deleteRouteProp,
    exportRoute: exportRouteProp, importRoute: importRouteProp, duplicateRoute: duplicateRouteProp,
    importTemplateRoute, importTypes, tabnavs: tabnavsProp, layouts = ['table'],
    onViewModeChange: onViewModeChangeProp, locale,
}: ToolbarProps) => {
    const dispatch = useDispatch();
    const { current: currentRouteName, actionRoutes, views } = useModule();


    const create = createProp ?? actions?.create ?? true;
    const deleteProp = deletePropVal ?? actions?.delete ?? actions?.destroy ?? true;
    const exportProp = exportPropVal ?? actions?.export ?? false;
    const importProp = importPropVal ?? actions?.import ?? false;
    const duplicateProp = duplicatePropVal ?? actions?.duplicate ?? false;
    const isToolbar = variant === "toolbar" || true;

    const resourceName = React.useMemo(() => {
        const parts = (actionRoutes.index || actionRoutes.show || '').split('.');
        return parts.slice(0, parts.length - 1).join('.');
    }, [actionRoutes]);

    const tabnavs = React.useMemo(() => {
        if (tabnavsProp) return tabnavsProp;
        if (ui !== 'table' || !actionRoutes.trash || !route.has(actionRoutes.trash)) return undefined;
        const listLabel = tt('common.list');
        const trashLabel = tt('common.trash');
        return [
            { label: (listLabel !== 'common.list' ? listLabel : null) || "Danh sách", route: resourceName + '.index', active: !currentRouteName?.includes('trash') },
            { label: (trashLabel !== 'common.trash' ? trashLabel : null) || "Thùng rác", route: actionRoutes.trash, active: !!currentRouteName?.includes('trash') }
        ] as TabNav[];
    }, [tabnavsProp, ui, actionRoutes.trash, currentRouteName, resourceName]);

    const isLoading = useSelector((state: RootState) => state.resource[resourceName!]?.loading || false);

    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [duplicateDialogOpen, setDuplicateDialogOpen] = React.useState(false);
    const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
    const [importDialogOpen, setImportDialogOpen] = React.useState(false);

    const { tableInstance, selectedCount, getSelectedRows } = useTableInstance(currentRouteName);

    const handleDelete = React.useCallback(() => {
        if (onDelete) onDelete();
        else if (selectedCount > 0 && resourceName) {
            dispatch(bulkDeleteResourceRequest({ resource: resourceName, ids: getSelectedRows().map(getIdFromRow) as any }));
            tableInstance?.resetRowSelection();
        }
        setDeleteDialogOpen(false);
    }, [onDelete, selectedCount, resourceName, getSelectedRows, getIdFromRow, dispatch, tableInstance]);

    const handleDuplicate = React.useCallback(() => {
        if (onDuplicate) onDuplicate();
        else if (selectedCount > 0 && resourceName) {
            dispatch(bulkDuplicateResourceRequest({ resource: resourceName, ids: getSelectedRows().map(getIdFromRow) as any }));
            tableInstance?.resetRowSelection();
        }
        setDuplicateDialogOpen(false);
    }, [onDuplicate, selectedCount, resourceName, getSelectedRows, getIdFromRow, dispatch, tableInstance]);

    const createRoute = resolveRoute(create, actionRoutes.create);
    const handleCreate = React.useCallback(() => {
        if (onCreate) onCreate();
        else if (createRoute) window.location.href = route(createRoute);
    }, [onCreate, createRoute]);

    const deleteRoute = resolveRoute(deleteProp, deleteRouteProp || actionRoutes.destroy);
    const exportRoute = resolveRoute(exportProp, exportRouteProp || actionRoutes.export || null);
    const importRoute = resolveRoute(importProp, importRouteProp || actionRoutes.import || null);
    const duplicateRoute = resolveRoute(duplicateProp, duplicateRouteProp || actionRoutes.duplicate || 'duplicate');
    const resolvedImportTemplate = importTemplateRoute || actionRoutes.importTemplate;

    const showCreate = create !== false && (onCreate || createRoute);
    const showDelete = deleteProp !== false && (onDelete || deleteRoute);
    const showExport = exportProp !== false && (onExport || exportRoute);
    const showImport = importProp !== false && (onImport || importRoute);
    const showDuplicate = duplicateProp !== false && (onDuplicate || duplicateRoute);
    const hasSelected = selectedCount > 0;

    const activeTabIndex = React.useMemo(() => {
        if (!tabnavs?.length) return -1;
        const explicitActive = tabnavs.findIndex(tab => tab.active === true);
        if (explicitActive >= 0) return explicitActive;
        if (currentRouteName) {
            const routeMatch = tabnavs.findIndex(tab => {
                if (!tab.route) return false;
                try { return (tab.route.startsWith('/') ? tab.route : route(tab.route)) === window.location.pathname || currentRouteName === tab.route; }
                catch { return window.location.pathname === tab.route || currentRouteName === tab.route; }
            });
            if (routeMatch >= 0) return routeMatch;
        }
        return 0;
    }, [tabnavs, currentRouteName]);

    const [subnavTarget, setSubnavTarget] = React.useState<HTMLElement | null>(null);
    React.useEffect(() => {
        setSubnavTarget(document.getElementById('page-subnav'));
    }, []);

    const hasTabs = tabnavs && tabnavs.length > 0;
    const hasActions = showDelete || showCreate || showExport || showImport || showDuplicate || (layouts && layouts.length > 1);

    if (!hasTabs && !hasActions) return null;

    const tabsJSX = hasTabs ? (
        <div className="flex items-center gap-0 border-b border-border/40 w-full px-2 overflow-x-auto bg-background">
            {tabnavs!.map((tab, index) => {
                const isActive = activeTabIndex === index;
                const tabHref = tab.route ? (tab.route.includes('.') ? route(tab.route) : tab.route) : tab.api;
                const hasLink = !tab.onClick && !!tabHref;
                return (
                    <Button key={index} variant="ghost" onClick={tab.onClick} asChild={hasLink}
                        className={cn(
                            "relative rounded-none border-b-2 px-5 py-3 h-auto text-sm whitespace-nowrap transition-all duration-200",
                            "hover:bg-transparent hover:text-foreground",
                            isActive
                                ? "border-primary text-foreground font-semibold"
                                : "border-transparent text-muted-foreground hover:text-foreground/80"
                        )}
                    >
                        {hasLink ? <Link href={tabHref!}>{tab.label}</Link> : <span>{tab.label}</span>}
                    </Button>
                );
            })}
        </div>
    ) : null;

    const handleDashboardItemClick = React.useCallback((item: DashboardStatItem) => {
        const filters = (item.query as any)?.filters;
        const url = new URL(window.location.href);

        // Reset all params
        url.search = '';
        url.searchParams.set('page', '1');

        if (filters && typeof filters === 'object') {
            // Dashboard filters might be in {field: value} or {field: {_eq: value}} format
            const columnFilters = Object.entries(filters).map(([field, condition]) => {
                let value = condition;
                if (typeof condition === 'object' && condition !== null) {
                    const condObj = condition as Record<string, any>;
                    const keys = Object.keys(condObj);
                    const firstKey = keys[0];
                    if (keys.length === 1 && firstKey?.startsWith('_')) {
                        value = condObj[firstKey];
                    }
                }
                return { id: field, value };
            });

            // Map to advanced filters for UI synchronization
            const advancedFilters = columnFilters.map(cf => ({
                id: Math.random().toString(36).substring(2, 9),
                field: cf.id,
                operator: '_eq',
                value: cf.value,
                type: 'text'
            }));
            
            url.searchParams.set('f', encodeFilters({ cf: columnFilters, af: advancedFilters }));
        }

        router.get(url.pathname + url.search, {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    }, []);

    const dashboardItems = Array.isArray(views?.dashboards) ? (views.dashboards as DashboardStatItem[]) : [];

    // Determine active dashboard item
    const activeDashboardItem = React.useMemo(() => {
        if (!dashboardItems.length) return null;
        const url = new URL(window.location.href);
        const f = url.searchParams.get('f');
        if (!f) {
            // Check for "Total Posts" (usually items with no filters or loaditems=count)
            return dashboardItems.find(item => {
                const queryFilters = (item.query as any)?.filters;
                return !queryFilters || Object.keys(queryFilters).length === 0;
            }) || null;
        };

        try {
            const currentFilters = JSON.parse(atob(f));
            // Extract column filters for comparison
            const cf = currentFilters.cf || currentFilters;
            if (!Array.isArray(cf)) return null;

            return dashboardItems.find(item => {
                const queryFilters = (item.query as any)?.filters;
                if (!queryFilters) return false;

                const queryFilterEntries = Object.entries(queryFilters);
                if (queryFilterEntries.length === 0) return false;

                // Compare each query filter with current column filters
                return queryFilterEntries.every(([field, condition]) => {
                    let expectedValue = condition;
                    if (typeof condition === 'object' && condition !== null) {
                        const condObj = condition as Record<string, any>;
                        const firstKey = Object.keys(condObj)[0];
                        if (firstKey?.startsWith('_')) expectedValue = condObj[firstKey];
                    }
                    return cf.some(f => f.id === field && String(f.value) === String(expectedValue));
                });
            });
        } catch {
            return null;
        }
    }, [dashboardItems, views]);

    return (
        <>
            {tabsJSX && subnavTarget ? createPortal(tabsJSX, subnavTarget) : tabsJSX}
            {dashboardItems.length > 0 && (
                <DashboardStats 
                    items={dashboardItems} 
                    onItemClick={handleDashboardItemClick} 
                    activeItem={activeDashboardItem}
                />
            )}
            <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-5", !isToolbar && "mb-4", className)}>
                {hasActions && (
                    <div className={cn("flex items-center gap-5 flex-wrap w-full md:w-auto", !isToolbar && "justify-end ml-auto")}>
                        {([
                            { id: 'import',    icon: Upload,   labelKey: 'common.import',            defaultLabel: 'Import',    variant: 'outline'     as const, show: !!showImport,                    onClick: () => setImportDialogOpen(true),    count: undefined as number | undefined },
                            { id: 'export',    icon: Download, labelKey: 'common.export',            defaultLabel: 'Export',    variant: 'outline'     as const, show: !!showExport,                    onClick: () => setExportDialogOpen(true),    count: undefined as number | undefined },
                            { id: 'duplicate', icon: Copy,     labelKey: 'common.duplicate_selected', defaultLabel: 'Duplicate', variant: 'outline'     as const, show: !!(showDuplicate && hasSelected), onClick: () => setDuplicateDialogOpen(true), count: selectedCount as number | undefined },
                            { id: 'delete',    icon: Trash2,   labelKey: 'common.delete',             defaultLabel: 'Delete',    variant: 'destructive' as const, show: !!(showDelete && hasSelected),    onClick: () => setDeleteDialogOpen(true),    count: selectedCount as number | undefined },
                        ]).filter(a => a.show).map(({ id, icon: Icon, labelKey, defaultLabel, variant, onClick, count }) => (
                            <Button key={id} variant={variant} size="sm" onClick={onClick}
                                className={cn("gap-2", variant === 'destructive' && "shadow-sm")} disabled={isLoading}>
                                <Icon className="h-4 w-4" />
                                {tt(labelKey) || defaultLabel}
                                {count !== undefined && ` (${count})`}
                            </Button>
                        ))}
                        {showCreate && (
                            createRoute ? (
                                <Link href={route(createRoute)}>
                                    <Button variant="default" size="sm" className="gap-2 shadow-sm"><Plus className="h-4 w-4" />{tt("common.add_new") || "Add New"}</Button>
                                </Link>
                            ) : (
                                <Button variant="default" size="sm" onClick={handleCreate} className="gap-2 shadow-sm"><Plus className="h-4 w-4" />{tt("common.add_new") || "Add New"}</Button>
                            )
                        )}
                        {locale && <div className="ml-2"><LocaleSwitcher /></div>}
                    </div>
                )}
            </div>
            <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDelete}
                title={tt("common.delete_selected")} description={tt("common.confirm_delete_selected")}
                confirmLabel={tt("common.delete")} variant="destructive" icon count={selectedCount} isLoading={isLoading} />
            <ConfirmDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen} onConfirm={handleDuplicate}
                title={tt("common.duplicate_selected")} description={tt("common.confirm_duplicate_selected")}
                confirmLabel={tt("common.duplicate")} count={hasSelected ? selectedCount : undefined} isLoading={isLoading} />
            <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} onExport={onExport} isLoading={isLoading} resourceName={resourceName} tableInstance={tableInstance} dispatch={dispatch} />
            <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImport={onImport} isLoading={isLoading} resourceName={resourceName} importTypes={importTypes} importTemplate={resolvedImportTemplate} dispatch={dispatch} />
        </>
    );
};
export { Toolbar as default, Toolbar };

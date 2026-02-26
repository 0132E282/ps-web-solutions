import * as React from "react";
import { Plus, Trash2, Download, Upload, FileUp, X, TriangleAlert, Copy } from "lucide-react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@core/components/ui/dialog";
import { Checkbox } from "@core/components/ui/checkbox";
import { Label } from "@core/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@core/components/ui/select";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@core/components/ui/empty";
import {
    bulkDeleteResourceRequest,
    bulkDuplicateResourceRequest,
    importResourceRequest,
    exportResourceRequest
} from "../../redux/slices/resourceSlice";

interface TabNav {
    label: string;
    api?: string;
    route?: string;
    onClick?: () => void;
    active?: boolean;
}

interface ImportType {
    value: string;
    label: string;
}

interface TableRowData {
    id?: string | number;
    [key: string]: unknown;
}

interface ColumnInfo {
    key: string;
    label: string;
}

interface HeaderToolbarTableProps {
    className?: string;
    create?: boolean | string;
    delete?: boolean | string;
    export?: boolean | string;
    import?: boolean | string;
    duplicate?: boolean | string;
    onCreate?: () => void;
    onDelete?: () => void | Promise<void>;
    onExport?: (columns?: string[], format?: 'xlsx' | 'csv', filter?: string, exportRelated?: boolean) => void | Promise<void>;
    onImport?: (file: File, fileType?: 'xlsx' | 'csv', importType?: string) => void | Promise<void>;
    onDuplicate?: () => void | Promise<void>;
    getIdFromRow?: (row: TableRowData) => string | number;
    deleteRoute?: string;
    exportRoute?: string;
    importRoute?: string;
    duplicateRoute?: string;
    importTemplateRoute?: string;
    importTypes?: ImportType[];
    tabnavs?: TabNav[];
}

type FileFormat = 'xlsx' | 'csv';
type ExportFilter = 'all' | 'current_filters' | 'today';

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const resolveRoute = (prop: boolean | string | undefined, fallback: string | null): string | null => {
    if (prop === false) return null;
    if (typeof prop === 'string') return prop;
    return fallback;
};

const HeaderToolbarTable = ({
    className = "",
    create = true,
    delete: deleteProp = true,
    export: exportProp = false,
    import: importProp = false,
    duplicate: duplicateProp = false,
    onCreate,
    onDelete,
    onExport,
    onImport,
    onDuplicate,
    getIdFromRow = (row: TableRowData) => row?.id ?? '',
    deleteRoute: deleteRouteProp,
    exportRoute: exportRouteProp,
    importRoute: importRouteProp,
    duplicateRoute: duplicateRouteProp,
    importTemplateRoute,
    importTypes,
    tabnavs,
}: HeaderToolbarTableProps) => {
    const dispatch = useDispatch();
    const { current: currentRouteName, crudRoutes } = useModule();

    const resourceName = React.useMemo(() => {
        const route = crudRoutes.index || crudRoutes.show || '';
        const parts = route.split('.');
        return parts.length > 2 ? parts[parts.length - 2] : parts[0];
    }, [crudRoutes]);

    const resourceState = useSelector((state: RootState) => state.resource[resourceName!]);
    const isLoading = resourceState?.loading || false;

    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [duplicateDialogOpen, setDuplicateDialogOpen] = React.useState(false);
    const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
    const [importDialogOpen, setImportDialogOpen] = React.useState(false);

    const [tableInstance, setTableInstance] = React.useState<Table<TableRowData> | null>(null);
    const [selectedColumns, setSelectedColumns] = React.useState<Set<string>>(new Set());
    const [exportFormat, setExportFormat] = React.useState<FileFormat>('xlsx');
    const [exportFilter, setExportFilter] = React.useState<ExportFilter>('current_filters');
    const [exportRelated, setExportRelated] = React.useState(false);
    const [importFileType, setImportFileType] = React.useState<FileFormat>('xlsx');
    const [selectedImportType, setSelectedImportType] = React.useState<string>(importTypes?.[0]?.value || '');
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Find table instance from registry
    React.useEffect(() => {
        const findTable = () => {
            const table = currentRouteName
                ? tableRegistry.getByRoute<TableRowData>(currentRouteName)
                : tableRegistry.get<TableRowData>();
            if (table) setTableInstance(table);
        };

        findTable();
        const timeout = setTimeout(findTable, 100);
        const interval = setInterval(findTable, 200);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [currentRouteName]);

    const [selectedCount, setSelectedCount] = React.useState(0);

    React.useEffect(() => {
        const updateSelectedCount = () => {
            if (!tableInstance) {
                setSelectedCount(0);
                return;
            }
            try {
                const count = tableInstance.getFilteredSelectedRowModel().rows.length;
                setSelectedCount(count);
            } catch {
                setSelectedCount(0);
            }
        };

        updateSelectedCount();
        const interval = setInterval(updateSelectedCount, 100);
        return () => clearInterval(interval);
    }, [tableInstance]);

    const getSelectedRows = React.useCallback((): TableRowData[] => {
        if (!tableInstance) return [];
        try {
            return tableInstance.getFilteredSelectedRowModel().rows.map((row) => row.original);
        } catch {
            return [];
        }
    }, [tableInstance]);

    const activeTabIndex = React.useMemo(() => {
        if (!tabnavs?.length) return -1;
        const explicitActive = tabnavs.findIndex(tab => tab.active === true);
        if (explicitActive >= 0) return explicitActive;

        if (currentRouteName) {
            const routeMatch = tabnavs.findIndex(tab => {
                if (!tab.route) return false;
                try {
                    const tabRouteUrl = tab.route.startsWith('/') ? tab.route : route(tab.route);
                    return tabRouteUrl === window.location.pathname || currentRouteName === tab.route;
                } catch {
                    return window.location.pathname === tab.route || currentRouteName === tab.route;
                }
            });
            if (routeMatch >= 0) return routeMatch;
        }
        return 0;
    }, [tabnavs, currentRouteName]);

    const createRoute = resolveRoute(create, crudRoutes.create);
    const deleteRoute = resolveRoute(deleteProp, deleteRouteProp || crudRoutes.destroy);
    const exportRoute = resolveRoute(exportProp, exportRouteProp ?? null);
    const importRoute = resolveRoute(importProp, importRouteProp ?? null);
    const duplicateRoute = resolveRoute(duplicateProp, duplicateRouteProp ?? 'duplicate');

    const showCreate = create !== false && (onCreate || createRoute);
    const showDelete = deleteProp !== false && (onDelete || deleteRoute);
    const showExport = exportProp !== false && (onExport || exportRoute);
    const showImport = importProp !== false && (onImport || importRoute);
    const showDuplicate = duplicateProp !== false && (onDuplicate || duplicateRoute);
    const hasSelected = selectedCount > 0;

    const availableColumns = React.useMemo((): ColumnInfo[] => {
        if (!tableInstance) return [];
        try {
            return tableInstance.getAllColumns()
                .filter((col) => {
                    const colDef = col.columnDef as { accessorKey?: string; meta?: { hidden?: boolean } };
                    const accessorKey = colDef?.accessorKey || col.id;
                    return accessorKey &&
                        accessorKey !== 'select' &&
                        col.id !== 'actions' &&
                        col.id !== 'select' &&
                        !colDef?.meta?.hidden;
                })
                .map((col): ColumnInfo => {
                    const colDef = col.columnDef as { accessorKey?: string };
                    const accessorKey = (colDef?.accessorKey || col.id) as string;
                    const header = col.columnDef?.header;
                    let headerTitle: string;
                    if (typeof header === 'string') {
                        headerTitle = header;
                    } else if (header && typeof header === 'object' && 'title' in header) {
                        headerTitle = String((header as { title?: unknown }).title || accessorKey);
                    } else {
                        headerTitle = accessorKey;
                    }
                    return { key: accessorKey, label: headerTitle || accessorKey };
                });
        } catch {
            return [];
        }
    }, [tableInstance]);

    React.useEffect(() => {
        if (availableColumns.length > 0 && selectedColumns.size === 0) {
            setSelectedColumns(new Set(availableColumns.map((col) => col.key)));
        }
    }, [availableColumns, selectedColumns.size]);

    const toggleColumn = React.useCallback((columnKey: string) => {
        setSelectedColumns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(columnKey)) {
                newSet.delete(columnKey);
            } else {
                newSet.add(columnKey);
            }
            return newSet;
        });
    }, []);

    const toggleAllColumns = React.useCallback(() => {
        setSelectedColumns(selectedColumns.size === availableColumns.length
            ? new Set()
            : new Set(availableColumns.map((col) => col.key))
        );
    }, [selectedColumns.size, availableColumns]);

    const handleDelete = React.useCallback(() => {
        if (onDelete) {
            onDelete();
        } else if (hasSelected && resourceName) {
            const selectedIds = getSelectedRows().map(getIdFromRow);
            dispatch(bulkDeleteResourceRequest({ resource: resourceName, ids: selectedIds }));
            tableInstance?.resetRowSelection();
        }
        setDeleteDialogOpen(false);
    }, [onDelete, hasSelected, resourceName, getSelectedRows, getIdFromRow, dispatch, tableInstance]);

    const handleDuplicate = React.useCallback(() => {
        if (onDuplicate) {
            onDuplicate();
        } else if (hasSelected && resourceName) {
            const selectedIds = getSelectedRows().map(getIdFromRow);
            dispatch(bulkDuplicateResourceRequest({ resource: resourceName, ids: selectedIds }));
            tableInstance?.resetRowSelection();
        }
        setDuplicateDialogOpen(false);
    }, [onDuplicate, hasSelected, resourceName, getSelectedRows, getIdFromRow, dispatch, tableInstance]);

    const handleCreate = React.useCallback(() => {
        if (onCreate) {
            onCreate();
        } else if (createRoute) {
            window.location.href = route(createRoute);
        }
    }, [onCreate, createRoute]);

    const handleExport = React.useCallback(() => {
        if (selectedColumns.size === 0 || !resourceName) return;

        const columnsArray = Array.from(selectedColumns);
        if (onExport) {
            onExport(columnsArray, exportFormat, exportFilter, exportRelated);
        } else {
            const params: Record<string, unknown> = {
                columns: columnsArray.join(','),
                format: exportFormat,
                export_related: exportRelated ? '1' : '0',
            };

            if (exportFilter === 'all' || exportFilter === 'today') {
                params.filter = exportFilter;
            } else if (exportFilter === 'current_filters' && tableInstance) {
                const state = tableInstance.getState();
                if (state.globalFilter) params.search = String(state.globalFilter);
                (state.columnFilters || []).forEach((filter) => {
                    if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
                        params[`filters[${filter.id}]`] = String(filter.value);
                    }
                });
            }

            dispatch(exportResourceRequest({ resource: resourceName, params }));
        }
        setExportDialogOpen(false);
    }, [onExport, resourceName, selectedColumns, exportFormat, exportFilter, exportRelated, tableInstance, dispatch]);

    const handleImportFile = React.useCallback(() => {
        if (!selectedFile || !resourceName) return;

        if (onImport) {
            onImport(selectedFile, importFileType, selectedImportType);
        } else {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('file_type', importFileType);
            if (selectedImportType) formData.append('import_type', selectedImportType);

            dispatch(importResourceRequest({ resource: resourceName, formData }));
        }
        setImportDialogOpen(false);
        setSelectedFile(null);
    }, [onImport, resourceName, selectedFile, importFileType, selectedImportType, dispatch]);

    const handleDownloadTemplate = React.useCallback(async () => {
        if (!importTemplateRoute || !resourceName) return;

        const params: Record<string, unknown> = { format: importFileType };
        if (selectedImportType) params.type = selectedImportType;

        dispatch(exportResourceRequest({ resource: resourceName, params: { ...params, template: 1 } }));
    }, [importTemplateRoute, resourceName, importFileType, selectedImportType, dispatch]);

    const handleFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) setSelectedFile(file);
    }, []);

    const handleRemoveFile = React.useCallback(() => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const FileFormatButtons = ({ value, onChange }: { value: FileFormat, onChange: (v: FileFormat) => void }) => (
        <div className="flex gap-2">
            {(['xlsx', 'csv'] as const).map((format) => (
                <Button
                    key={format}
                    type="button"
                    variant={value === format ? 'default' : 'outline'}
                    onClick={() => onChange(format)}
                    className="min-w-[80px]"
                >
                    {format.toUpperCase()}
                </Button>
            ))}
        </div>
    );

    const getCreateHref = () => {
        if (!createRoute) return '#';
        try { return route(createRoute); } catch { return '#'; }
    };

    const hasTabs = tabnavs && tabnavs.length > 0;
    const hasActions = showDelete || showCreate || showExport || showImport || showDuplicate;

    if (!hasTabs && !hasActions) return null;

    return (
        <>
        <div className={cn("flex flex-col md:flex-row md:items-center justify-end gap-4 mb-4", className)}>
            {hasTabs && (
                <div className="flex items-center gap-1 border-b w-full md:w-auto md:border-none overflow-x-auto">
                    {tabnavs.map((tab, index) => {
                        const isActive = activeTabIndex === index;
                        const tabHref = tab.route ? (tab.route.includes('.') ? route(tab.route) : tab.route) : tab.api;
                        const hasLink = !tab.onClick && !!tabHref;
                        return (
                            <Button
                                key={index}
                                variant="ghost"
                                className={cn(
                                    "rounded-b-none border-b-2 border-transparent px-4 py-2 h-auto whitespace-nowrap",
                                    "hover:bg-transparent hover:text-foreground",
                                    isActive && "border-primary text-foreground font-medium",
                                    !isActive && "text-muted-foreground"
                                )}
                                onClick={tab.onClick}
                                asChild={hasLink}
                            >
                                {hasLink ? <Link href={tabHref!}>{tab.label}</Link> : <span>{tab.label}</span>}
                            </Button>
                        );
                    })}
                </div>
            )}

            {hasActions && (
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                    {showImport && (
                        <>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={importFileType === 'xlsx' ? '.xlsx,.xls' : '.csv'}
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)} className="gap-2" disabled={isLoading}>
                                <Upload className="h-4 w-4" />
                                {tt("common.import")}
                            </Button>
                        </>
                    )}
                    {showExport && (
                        <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)} className="gap-2" disabled={isLoading}>
                            <Download className="h-4 w-4" />
                            {tt("common.export")}
                        </Button>
                    )}
                    {showDuplicate && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDuplicateDialogOpen(true)}
                            className="gap-2"
                            disabled={!hasSelected || isLoading}
                        >
                            <Copy className="h-4 w-4" />
                            {hasSelected ? `${tt("common.duplicate_selected")} (${selectedCount})` : tt("common.duplicate")}
                        </Button>
                    )}
                    {showDelete && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteDialogOpen(true)}
                            className="gap-2"
                            disabled={!hasSelected || isLoading}
                        >
                            <Trash2 className="h-4 w-4" />
                            {tt("common.delete")} {hasSelected && `(${selectedCount})`}
                        </Button>
                    )}
                    {showCreate && (
                        createRoute ? (
                            <Link href={getCreateHref()}>
                                <Button variant="default" size="sm" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    {tt("common.add_new")}
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="default" size="sm" onClick={handleCreate} className="gap-2">
                                <Plus className="h-4 w-4" />
                                {tt("common.add_new")}
                            </Button>
                        )
                    )}
                </div >
            )}
        </div>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                            <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <TriangleAlert className="h-6 w-6 text-red-600" aria-hidden="true" />
                            </div>
                            <div className="text-center sm:ml-4 sm:text-left">
                                <DialogTitle className="text-lg font-semibold text-foreground">
                                    {tt("common.delete_selected")}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground mt-2">
                                    {tt("common.confirm_delete_selected")}
                                    <span className="block mt-2 font-medium text-foreground">
                                        {tt("common.selected_items")}: {selectedCount}
                                    </span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            {tt("common.cancel")}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                            {isLoading ? tt("common.loading") : tt("common.delete")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Duplicate Dialog */}
            <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-foreground">
                            {tt("common.duplicate_selected")}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground mt-2">
                            {tt("common.confirm_duplicate_selected")}
                            {hasSelected && (
                                <span className="block mt-2 font-medium text-foreground">
                                    {tt("common.selected_items")}: {selectedCount}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-end gap-2">
                        <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
                            {tt("common.cancel")}
                        </Button>
                        <Button onClick={handleDuplicate} disabled={isLoading}>
                            {isLoading ? tt("common.loading") : tt("common.duplicate")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Export Dialog */}
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogContent className="max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="pb-3">
                        <DialogTitle className="text-lg">{tt("common.export")}</DialogTitle>
                        <DialogDescription className="text-sm">
                            {tt("common.select_columns_and_format")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-3 flex-1 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">{tt("common.file_format")}</Label>
                                <FileFormatButtons value={exportFormat} onChange={setExportFormat} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">{tt("common.export_filter") || "Lọc dữ liệu xuất"}</Label>
                                <div className="flex flex-wrap gap-2">
                                    {([
                                        { value: 'all' as const, label: tt("common.export_all") || "Export tất cả" },
                                        { value: 'current_filters' as const, label: tt("common.use_current_filters") || "Sử dụng bộ lọc hiện tại" },
                                        { value: 'today' as const, label: tt("common.today") || "Hôm nay" }
                                    ]).map(({ value, label }) => (
                                        <Button
                                            key={value}
                                            type="button"
                                            variant={exportFilter === value ? 'default' : 'outline'}
                                            onClick={() => setExportFilter(value)}
                                        >
                                            {label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 p-3 border rounded-md">
                            <Checkbox
                                id="export-related"
                                checked={exportRelated}
                                onCheckedChange={(checked) => setExportRelated(!!checked)}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="export-related" className="text-sm font-medium cursor-pointer flex-1">
                                {tt("common.export_related") || "Xuất các bản liên kết với nhau"}
                            </Label>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">{tt("common.select_columns")}</Label>
                                <Button type="button" variant="ghost" size="sm" onClick={toggleAllColumns}>
                                    {selectedColumns.size === availableColumns.length ? tt("common.deselect_all") : tt("common.select_all")}
                                </Button>
                            </div>
                            <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
                                {availableColumns.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        {tt("common.no_columns_available")}
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-4 gap-2">
                                        {availableColumns.map((column) => (
                                            <div key={column.key} className="flex items-center space-x-2 py-1">
                                                <Checkbox
                                                    id={column.key}
                                                    checked={selectedColumns.has(column.key)}
                                                    onCheckedChange={() => toggleColumn(column.key)}
                                                    className="h-4 w-4"
                                                />
                                                <Label htmlFor={column.key} className="text-sm font-normal cursor-pointer flex-1 leading-relaxed">
                                                    {column.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                            {tt("common.cancel")}
                        </Button>
                        <Button variant="default" onClick={handleExport} disabled={isLoading || selectedColumns.size === 0}>
                            {isLoading ? tt("common.loading") : tt("common.export")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={importDialogOpen} onOpenChange={(open) => {
                setImportDialogOpen(open);
                if (!open) {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            }}>
                <DialogContent className="max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="pb-3">
                        <DialogTitle className="text-lg">{tt("common.import")}</DialogTitle>
                        <DialogDescription className="text-sm">
                            {tt("common.select_file_type_and_upload") || "Chọn loại file và tải lên"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-3 flex-1 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            {importTypes && importTypes.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">{tt("common.import_type") || "Kiểu import"}</Label>
                                    <Select value={selectedImportType} onValueChange={setSelectedImportType}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={tt("common.select_import_type") || "Chọn kiểu import"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {importTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">{tt("common.file_type") || "Loại file"}</Label>
                                <FileFormatButtons value={importFileType} onChange={setImportFileType} />
                            </div>
                        </div>

                        {importTemplateRoute && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">{tt("common.download_template") || "Tải file mẫu"}</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleDownloadTemplate}
                                    disabled={isLoading}
                                    className="gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    {isLoading ? tt("common.loading") : tt("common.download_template") || "Tải file mẫu"}
                                </Button>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">{tt("common.select_file") || "Chọn file"}</Label>
                            {!selectedFile ? (
                                <Empty className="border border-dashed">
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <FileUp className="h-6 w-6" />
                                        </EmptyMedia>
                                        <EmptyTitle>{tt("common.no_file_selected") || "Chưa chọn file"}</EmptyTitle>
                                        <EmptyDescription>
                                            {tt("common.select_file_to_import") || "Chọn file để import dữ liệu"}
                                        </EmptyDescription>
                                    </EmptyHeader>
                                    <EmptyContent>
                                        <div className="flex flex-col gap-2 w-full">
                                            <Button
                                                variant="outline"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isLoading}
                                                className="gap-2"
                                            >
                                                <Upload className="h-4 w-4" />
                                                {tt("common.browse") || "Chọn file"}
                                            </Button>
                                        </div>
                                    </EmptyContent>
                                </Empty>
                            ) : (
                                <div className="border rounded-md p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileUp className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <div className="text-sm font-medium">{selectedFile.name}</div>
                                                <div className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</div>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleRemoveFile}
                                            disabled={isLoading}
                                            className="h-8 w-8"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                            {tt("common.cancel")}
                        </Button>
                        {selectedFile && (
                            <Button variant="default" onClick={handleImportFile} disabled={isLoading} className="gap-2">
                                {isLoading ? tt("common.loading") : tt("common.import")}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default HeaderToolbarTable;

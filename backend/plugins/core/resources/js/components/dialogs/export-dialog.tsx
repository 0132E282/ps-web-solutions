import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@core/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@core/components/ui/dialog";
import { Checkbox } from "@core/components/ui/checkbox";
import { Label } from "@core/components/ui/label";
import { tt } from "@core/lib/i18n";
import { exportResourceRequest } from "@core/redux/slices/resourceSlice";
import type { Table } from "@tanstack/react-table";

export type FileFormat = 'xlsx' | 'csv';
type ExportFilter = 'all' | 'current_filters' | 'today';
interface ColumnInfo { key: string; label: string; }

const FileFormatButtons = ({ value, onChange }: { value: FileFormat; onChange: (v: FileFormat) => void }) => (
    <div className="flex gap-2">
        {(['xlsx', 'csv'] as const).map((format) => (
            <Button key={format} type="button" variant={value === format ? 'default' : 'outline'} onClick={() => onChange(format)} className="min-w-[80px]">
                {format.toUpperCase()}
            </Button>
        ))}
    </div>
);

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onExport?: (columns?: string[], format?: FileFormat, filter?: string, exportRelated?: boolean) => void | Promise<void>;
    isLoading: boolean;
    resourceName: string | null;
    tableInstance: Table<Record<string, unknown>> | null;
    dispatch: (action: any) => void;
}

export const ExportDialog = ({ open, onOpenChange, onExport, isLoading, resourceName, tableInstance, dispatch }: ExportDialogProps) => {
    const [exportFormat, setExportFormat] = React.useState<FileFormat>('xlsx');
    const [exportFilter, setExportFilter] = React.useState<ExportFilter>('current_filters');
    const [exportRelated, setExportRelated] = React.useState(false);
    const [selectedColumns, setSelectedColumns] = React.useState<Set<string>>(new Set());

    const availableColumns = React.useMemo((): ColumnInfo[] => {
        if (!tableInstance) return [];
        try {
            return tableInstance.getAllColumns().filter((col: any) => {
                const colDef = col.columnDef as any;
                const accessorKey = colDef?.accessorKey || col.id;
                return accessorKey && accessorKey !== 'select' && col.id !== 'actions' && col.id !== 'select' && !colDef?.meta?.hidden;
            }).map((col: any): ColumnInfo => {
                const colDef = col.columnDef as any;
                const accessorKey = (colDef?.accessorKey || col.id) as string;
                const header = col.columnDef?.header;
                let hTitle = accessorKey;
                if (typeof header === 'string') hTitle = header;
                else if (header && typeof header === 'object' && 'title' in header) hTitle = String((header as any).title || accessorKey);
                return { key: accessorKey, label: hTitle || accessorKey };
            });
        } catch { return []; }
    }, [tableInstance]);

    React.useEffect(() => {
        if (open && availableColumns.length > 0 && selectedColumns.size === 0) setSelectedColumns(new Set(availableColumns.map((col) => col.key)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, availableColumns]);

    const handleExport = () => {
        if (selectedColumns.size === 0 || !resourceName) return;
        const columnsArray = Array.from(selectedColumns);
        if (onExport) onExport(columnsArray, exportFormat, exportFilter, exportRelated);
        else {
            const params: Record<string, unknown> = { columns: columnsArray.join(','), format: exportFormat, export_related: exportRelated ? '1' : '0' };
            if (exportFilter === 'all' || exportFilter === 'today') params.filter = exportFilter;
            else if (exportFilter === 'current_filters' && tableInstance) {
                const state = tableInstance.getState();
                if (state.globalFilter) params.search = String(state.globalFilter);
                (state.columnFilters || []).forEach((filter: any) => {
                    if (filter.value !== undefined && filter.value !== null && filter.value !== '') params[`filters[${filter.id}]`] = String(filter.value);
                });
            }
            dispatch(exportResourceRequest({ resource: resourceName, params }));
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-3">
                    <DialogTitle className="text-lg">{tt("common.export")}</DialogTitle>
                    <DialogDescription className="text-sm">{tt("common.select_columns_and_format")}</DialogDescription>
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
                                {[
                                    { value: 'all', label: tt("common.export_all") || "Export tất cả" },
                                    { value: 'current_filters', label: tt("common.use_current_filters") || "Sử dụng bộ lọc hiện tại" },
                                    { value: 'today', label: tt("common.today") || "Hôm nay" }
                                ].map(({ value, label }) => (
                                    <Button key={value} type="button" variant={exportFilter === value ? 'default' : 'outline'} onClick={() => setExportFilter(value as ExportFilter)}>{label}</Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-md">
                        <Checkbox id="export-related" checked={exportRelated} onCheckedChange={(c) => setExportRelated(!!c)} className="h-4 w-4" />
                        <Label htmlFor="export-related" className="text-sm font-medium cursor-pointer flex-1">{tt("common.export_related") || "Xuất các bản liên kết với nhau"}</Label>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">{tt("common.select_columns")}</Label>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedColumns(selectedColumns.size === availableColumns.length ? new Set() : new Set(availableColumns.map((c) => c.key)))}>
                                {selectedColumns.size === availableColumns.length ? tt("common.deselect_all") : tt("common.select_all")}
                            </Button>
                        </div>
                        <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
                            {availableColumns.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">{tt("common.no_columns_available")}</p>
                            ) : (
                                <div className="grid grid-cols-4 gap-2">
                                    {availableColumns.map((column) => (
                                        <div key={column.key} className="flex items-center space-x-2 py-1">
                                            <Checkbox id={column.key} checked={selectedColumns.has(column.key)} onCheckedChange={() => setSelectedColumns(prev => { const n = new Set(prev); if (n.has(column.key)) n.delete(column.key); else n.add(column.key); return n; })} className="h-4 w-4" />
                                            <Label htmlFor={column.key} className="text-sm font-normal cursor-pointer flex-1 leading-relaxed">{column.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{tt("common.cancel")}</Button>
                    <Button variant="default" onClick={handleExport} disabled={isLoading || selectedColumns.size === 0}>
                        {isLoading ? tt("common.loading") : tt("common.export")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

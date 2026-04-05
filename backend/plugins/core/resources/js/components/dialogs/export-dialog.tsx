import * as React from "react";
import { Button } from "@core/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@core/components/ui/dialog";
import { Checkbox } from "@core/components/ui/checkbox";
import { Label } from "@core/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@core/components/ui/radio-group";
import { tt } from "@core/lib/i18n";
import { exportResourceRequest } from "@core/redux/slices/resourceSlice";
import type { Table } from "@tanstack/react-table";

export type FileFormat = 'xlsx' | 'csv';
type ExportFilter = 'all' | 'current_filters' | 'today';
type ExportLanguage = 'vi' | 'en' | 'all';
interface ColumnInfo { key: string; label: string; }

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onExport?: (columns?: string[], format?: FileFormat, filter?: string, exportRelated?: boolean, locale?: string) => void | Promise<void>;
    isLoading: boolean;
    resourceName: string | null;
    tableInstance: Table<Record<string, unknown>> | null;
    dispatch: (action: any) => void;
}

export const ExportDialog = ({ open, onOpenChange, onExport, isLoading, resourceName, tableInstance, dispatch }: ExportDialogProps) => {
    const [exportFormat, setExportFormat] = React.useState<FileFormat>('xlsx');
    const [exportFilter, setExportFilter] = React.useState<ExportFilter>('all');
    const [exportLanguage, setExportLanguage] = React.useState<ExportLanguage>('vi');
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
        if (onExport) onExport(columnsArray, exportFormat, exportFilter, false, exportLanguage);
        else {
            const params: Record<string, unknown> = {
                columns: columnsArray.join(','),
                format: exportFormat,
                locale: exportLanguage === 'all' ? '' : exportLanguage
            };
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
            <DialogContent className="max-w-[800px] max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl rounded-2xl">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-2xl font-bold text-slate-800">{tt("common.export_data_config") || "Cấu hình xuất dữ liệu"}</DialogTitle>
                    <DialogDescription className="text-slate-500 mt-1">
                        {tt("common.select_export_columns_hint") || (exportFormat === 'xlsx' ? "Chọn các cột dữ liệu bạn muốn xuất ra file Excel." : "Chọn các cột dữ liệu bạn muốn xuất ra file CSV.")}
                    </DialogDescription>
                </DialogHeader>

                <div className="px-8 flex-1 overflow-y-auto space-y-8 py-4">
                    {/* Phạm vi xuất dữ liệu */}
                    <div className="space-y-3">
                        <Label className="text-[15px] font-bold text-slate-900">{tt("common.export_scope") || "Phạm vi xuất dữ liệu"}</Label>
                        <RadioGroup value={exportFilter} onValueChange={(v) => setExportFilter(v as ExportFilter)} className="flex gap-6">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="all" id="scope-all" className="w-4 h-4 border-blue-500 text-blue-500" />
                                <Label htmlFor="scope-all" className="text-[14px] font-medium text-slate-700 cursor-pointer">{tt("common.export_all_data") || "Tất cả dữ liệu"}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="current_filters" id="scope-filters" className="w-4 h-4 border-blue-500 text-blue-500" />
                                <Label htmlFor="scope-filters" className="text-[14px] font-medium text-slate-700 cursor-pointer">{tt("common.use_current_filters") || "Theo bộ lọc hiện tại"}</Label>
                            </div>
                        </RadioGroup>
                        <p className="text-sm text-blue-600 font-medium">
                            <span className="font-bold">{tt("common.note") || "Lưu ý"}:</span> {tt("common.export_limit_hint") || "Hệ thống giới hạn xuất tối đa 20.000 bản ghi mới nhất."}
                        </p>
                    </div>

                    {/* Định dạng file */}
                    <div className="space-y-3">
                        <Label className="text-[15px] font-bold text-slate-900">{tt("common.file_format") || "Định dạng file"}</Label>
                        <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as FileFormat)} className="flex gap-6">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="xlsx" id="format-xlsx" className="w-4 h-4 border-blue-500 text-blue-500" />
                                <Label htmlFor="format-xlsx" className="text-[14px] font-medium text-slate-700 cursor-pointer">Excel (.xlsx)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="csv" id="format-csv" className="w-4 h-4 border-blue-500 text-blue-500" />
                                <Label htmlFor="format-csv" className="text-[14px] font-medium text-slate-700 cursor-pointer">CSV (.csv)</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Ngôn ngữ */}
                    <div className="space-y-3">
                        <Label className="text-[15px] font-bold text-slate-900">{tt("common.language") || "Ngôn ngữ"}</Label>
                        <RadioGroup value={exportLanguage} onValueChange={(v) => setExportLanguage(v as ExportLanguage)} className="flex gap-6">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="vi" id="lang-vi" className="w-4 h-4 border-blue-500 text-blue-500" />
                                <Label htmlFor="lang-vi" className="text-[14px] font-medium text-slate-700 cursor-pointer">{tt("common.vietnamese") || "Tiếng Việt"}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="en" id="lang-en" className="w-4 h-4 border-blue-500 text-blue-500" />
                                <Label htmlFor="lang-en" className="text-[14px] font-medium text-slate-700 cursor-pointer">{tt("common.english") || "Tiếng Anh"}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="all" id="lang-all" className="w-4 h-4 border-blue-500 text-blue-500" />
                                <Label htmlFor="lang-all" className="text-[14px] font-medium text-slate-700 cursor-pointer">{tt("common.all_languages") || "Tất cả ngôn ngữ"}</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Cấu hình cột dữ liệu */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <Label className="text-[15px] font-bold text-slate-900">{tt("common.column_config") || "Cấu hình cột dữ liệu"}</Label>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedColumns(new Set(availableColumns.map(c => c.key)))}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    {tt("common.select_all") || "Chọn tất cả"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedColumns(new Set())}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    {tt("common.deselect") || "Bỏ chọn"}
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-100">
                            {availableColumns.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">{tt("common.no_columns_available")}</p>
                            ) : (
                                <div className="grid grid-cols-4 gap-y-4 gap-x-6">
                                    {availableColumns.map((column) => (
                                        <div key={column.key} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={column.key}
                                                checked={selectedColumns.has(column.key)}
                                                onCheckedChange={() => setSelectedColumns(prev => {
                                                    const n = new Set(prev);
                                                    if (n.has(column.key)) n.delete(column.key);
                                                    else n.add(column.key);
                                                    return n;
                                                })}
                                                className="h-4 w-4 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded"
                                            />
                                            <Label htmlFor={column.key} className="text-sm font-medium text-slate-600 cursor-pointer flex-1 leading-tight">{column.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 pt-6 border-t border-slate-100 gap-4 flex sm:justify-end">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="px-8 min-w-[100px] text-slate-600 hover:bg-slate-100 font-semibold"
                    >
                        {tt("common.cancel") || "Hủy"}
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleExport}
                        disabled={isLoading || selectedColumns.size === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 min-w-[140px] font-semibold"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {tt("common.loading") || "Đang xử lý..."}
                            </span>
                        ) : (
                            `${tt("common.export") || "Xuất"} ${exportFormat.toUpperCase()}`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


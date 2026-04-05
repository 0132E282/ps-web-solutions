import * as React from "react";
import { FileUp, Upload, X } from "lucide-react";
import { Button } from "@core/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@core/components/ui/dialog";
import { Label } from "@core/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@core/components/ui/radio-group";
import { tt } from "@core/lib/i18n";
import { importResourceRequest, exportResourceRequest } from "@core/redux/slices/resourceSlice";
import { cn } from "@core/lib/utils";

export type FileFormat = 'xlsx' | 'csv';
export type ImportLanguage = 'vi' | 'en' | 'all';

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

interface ImportType { value: string; label: string; }

interface ImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport?: (file: File, fileType?: FileFormat, importType?: string, locale?: string) => void | Promise<void>;
    isLoading: boolean;
    resourceName: string | null;
    importTypes?: ImportType[];
    importTemplate?: string | null;
    dispatch: (action: any) => void;
}

export const ImportDialog = ({ open, onOpenChange, onImport, isLoading, resourceName, importTypes, importTemplate, dispatch }: ImportDialogProps) => {
    const [importFileType] = React.useState<FileFormat>('xlsx');
    const [selectedImportType, setSelectedImportType] = React.useState<string>(importTypes?.[0]?.value || '');
    const [exportLanguage, setExportLanguage] = React.useState<ImportLanguage>('vi');
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (!open) {
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } else if (importTypes && importTypes.length > 0) {
            setSelectedImportType(importTypes[0].value);
        }
    }, [open, importTypes]);

    const handleImportFile = () => {
        if (!selectedFile || !resourceName) return;
        const locale = exportLanguage === 'all' ? '' : exportLanguage;
        if (onImport) onImport(selectedFile, importFileType, selectedImportType, locale);
        else {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('file_type', importFileType);
            formData.append('locale', locale);
            if (selectedImportType) formData.append('import_type', selectedImportType);
            dispatch(importResourceRequest({ resource: resourceName, formData }));
        }
        onOpenChange(false);
    };

    const handleDownloadTemplate = () => {
        if (!importTemplate || !resourceName) return;
        const params: Record<string, unknown> = { format: importFileType, template: 1 };
        if (selectedImportType) params.type = selectedImportType;
        dispatch(exportResourceRequest({ resource: resourceName, params }));
    };

    // Sub-components for conciseness
    const Section = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-[15px] font-bold text-slate-900">{title}</Label>
                {action}
            </div>
            {children}
        </div>
    );

    const RadioOption = ({ value, id, label }: { value: string; id: string; label: string }) => (
        <div className="flex items-center space-x-2">
            <RadioGroupItem value={value} id={id} className="w-4 h-4 border-blue-500 text-blue-500" />
            <Label htmlFor={id} className="text-[14px] font-medium text-slate-700 cursor-pointer">{label}</Label>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[650px] max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl rounded-2xl">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-2xl font-bold text-slate-800">
                        {tt("common.import_resource_from_excel", { resource: resourceName }) || `Nhập ${resourceName || ""} từ Excel`}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 mt-1">
                        {tt("common.select_file_import_description", { resource: resourceName }) || `Chọn file Excel hoặc CSV để import dữ liệu ${resourceName || ""}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-8">
                    {/* Ngôn ngữ dữ liệu */}
                    <Section title={tt("common.data_language") || "Ngôn ngữ dữ liệu"}>
                        <RadioGroup value={exportLanguage} onValueChange={(v) => setExportLanguage(v as ImportLanguage)} className="flex gap-8">
                            <RadioOption value="vi" id="lang-vi" label={tt("common.vietnamese") || "Tiếng Việt"} />
                            <RadioOption value="en" id="lang-en" label={tt("common.english") || "Tiếng Anh"} />
                            <RadioOption value="all" id="lang-all" label={tt("common.all_languages") || "Tất cả ngôn ngữ"} />
                        </RadioGroup>
                    </Section>

                    {/* Loại dữ liệu (Import Types) - Chỉ hiển thị khi có từ 2 loại trở lên */}
                    {importTypes && importTypes.length > 1 && (
                        <Section title={tt("common.import_type") || "Loại dữ liệu"}>
                            <RadioGroup value={selectedImportType} onValueChange={setSelectedImportType} className="flex flex-wrap gap-x-8 gap-y-4">
                                {importTypes.map((type) => (
                                    <RadioOption key={type.value} value={type.value} id={`type-${type.value}`} label={type.label} />
                                ))}
                            </RadioGroup>
                        </Section>
                    )}

                    {/* File dữ liệu */}
                    <Section 
                        title={tt("common.file_data") || "File dữ liệu"} 
                        action={importTemplate && (
                            <button type="button" onClick={handleDownloadTemplate} className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                {tt("common.download_template_here") || "Tải file mẫu tại đây"}
                            </button>
                        )}
                    >
                        {!selectedFile ? (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault(); setIsDragging(false);
                                    const file = e.dataTransfer.files?.[0];
                                    if (file && ['xlsx', 'xls', 'csv'].includes(file.name.split('.').pop()?.toLowerCase() || '')) setSelectedFile(file);
                                }}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "relative border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400 group",
                                    isDragging ? "border-blue-500 bg-blue-50/50 text-blue-600" : "border-slate-200 text-slate-400"
                                )}
                            >
                                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])} />
                                <div className={cn("p-4 rounded-full transition-colors", isDragging ? "bg-blue-100/50" : "bg-slate-100 group-hover:bg-blue-100/50")}>
                                    <Upload className={cn("h-10 w-10 transition-colors", isDragging ? "text-blue-500" : "text-slate-400 group-hover:text-blue-500")} />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-slate-600 font-medium">
                                        {tt("common.drag_drop_file_hint") || "Kéo thả file vào đây hoặc"} <span className="text-blue-600">{tt("common.choose_file") || "chọn file"}</span>
                                    </p>
                                    <p className="text-[13px] text-slate-400">{tt("common.support_format_hint") || "Hỗ trợ: Excel (.xlsx, .xls), CSV (.csv)"}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100/50 rounded-lg"><FileUp className="h-6 w-6 text-blue-600" /></div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">{selectedFile.name}</div>
                                        <div className="text-xs text-slate-500 font-medium">{formatFileSize(selectedFile.size)}</div>
                                    </div>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} disabled={isLoading} className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        )}
                    </Section>
                </div>

                <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3 flex-row rounded-b-2xl">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="px-6 font-semibold text-slate-600 hover:bg-slate-200/50 transition-all h-11">
                        {tt("common.cancel") || "Hủy"}
                    </Button>
                    <Button type="button" onClick={handleImportFile} disabled={isLoading || !selectedFile} className="px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-200 h-11 rounded-xl">
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {tt("common.loading") || "Đang xử lý..."}
                            </span>
                        ) : tt("common.import") || "Import"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

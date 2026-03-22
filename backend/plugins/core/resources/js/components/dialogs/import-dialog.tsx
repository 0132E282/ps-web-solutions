import * as React from "react";
import { Download, FileUp, Upload, X } from "lucide-react";
import { Button } from "@core/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@core/components/ui/dialog";
import { Label } from "@core/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@core/components/ui/select";
import {
    Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@core/components/ui/empty";
import { tt } from "@core/lib/i18n";
import { importResourceRequest, exportResourceRequest } from "@core/redux/slices/resourceSlice";

export type FileFormat = 'xlsx' | 'csv';

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const FileFormatButtons = ({ value, onChange }: { value: FileFormat; onChange: (v: FileFormat) => void }) => (
    <div className="flex gap-2">
        {(['xlsx', 'csv'] as const).map((format) => (
            <Button key={format} type="button" variant={value === format ? 'default' : 'outline'} onClick={() => onChange(format)} className="min-w-[80px]">
                {format.toUpperCase()}
            </Button>
        ))}
    </div>
);

interface ImportType { value: string; label: string; }

interface ImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport?: (file: File, fileType?: FileFormat, importType?: string) => void | Promise<void>;
    isLoading: boolean;
    resourceName: string | null;
    importTypes?: ImportType[];
    importTemplate?: string | null;
    dispatch: (action: any) => void;
}

export const ImportDialog = ({ open, onOpenChange, onImport, isLoading, resourceName, importTypes, importTemplate, dispatch }: ImportDialogProps) => {
    const [importFileType, setImportFileType] = React.useState<FileFormat>('xlsx');
    const [selectedImportType, setSelectedImportType] = React.useState<string>(importTypes?.[0]?.value || '');
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (!open) { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }
    }, [open]);

    const handleImportFile = () => {
        if (!selectedFile || !resourceName) return;
        if (onImport) onImport(selectedFile, importFileType, selectedImportType);
        else {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('file_type', importFileType);
            if (selectedImportType) formData.append('import_type', selectedImportType);
            dispatch(importResourceRequest({ resource: resourceName, formData }));
        }
        onOpenChange(false);
    };

    const handleDownloadTemplate = () => {
        if (!importTemplate || !resourceName) return;
        const params: Record<string, unknown> = { format: importFileType };
        if (selectedImportType) params.type = selectedImportType;
        dispatch(exportResourceRequest({ resource: resourceName, params: { ...params, template: 1 } }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-3">
                    <DialogTitle className="text-lg">{tt("common.import")}</DialogTitle>
                    <DialogDescription className="text-sm">{tt("common.select_file_type_and_upload") || "Chọn loại file và tải lên"}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-3 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        {importTypes && importTypes.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">{tt("common.import_type") || "Kiểu import"}</Label>
                                <Select value={selectedImportType} onValueChange={setSelectedImportType}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder={tt("common.select_import_type") || "Chọn kiểu import"} /></SelectTrigger>
                                    <SelectContent>
                                        {importTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">{tt("common.file_type") || "Loại file"}</Label>
                            <FileFormatButtons value={importFileType} onChange={setImportFileType} />
                        </div>
                    </div>
                    {importTemplate && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">{tt("common.download_template") || "Tải file mẫu"}</Label>
                            <Button type="button" variant="outline" onClick={handleDownloadTemplate} disabled={isLoading} className="gap-2">
                                <Download className="h-4 w-4" />{isLoading ? tt("common.loading") : tt("common.download_template") || "Tải file mẫu"}
                            </Button>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{tt("common.select_file") || "Chọn file"}</Label>
                        {!selectedFile ? (
                            <Empty className="border border-dashed">
                                <EmptyHeader>
                                    <EmptyMedia variant="icon"><FileUp className="h-6 w-6" /></EmptyMedia>
                                    <EmptyTitle>{tt("common.no_file_selected") || "Chưa chọn file"}</EmptyTitle>
                                    <EmptyDescription>{tt("common.select_file_to_import") || "Chọn file để import dữ liệu"}</EmptyDescription>
                                </EmptyHeader>
                                <EmptyContent>
                                    <div className="flex flex-col gap-2 w-full">
                                        <input ref={fileInputRef} type="file" accept={importFileType === 'xlsx' ? '.xlsx,.xls' : '.csv'} className="hidden" onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])} />
                                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="gap-2">
                                            <Upload className="h-4 w-4" />{tt("common.browse") || "Chọn file"}
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
                                    <Button type="button" variant="ghost" size="icon" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} disabled={isLoading} className="h-8 w-8">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{tt("common.cancel")}</Button>
                    {selectedFile && (
                        <Button variant="default" onClick={handleImportFile} disabled={isLoading} className="gap-2">
                            {isLoading ? tt("common.loading") : tt("common.import")}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

import { Button } from "@core/components/ui/button";
import { Copy, Scissors, Download, Archive, Trash2, X, FileArchive, Folder } from "lucide-react";
import type { FileItem } from "@core/types";

interface FileSelectionActionsProps {
  selectedItems: FileItem[];
  onCopy?: (items: FileItem[]) => void;
  onCut?: (items: FileItem[]) => void;
  onDownload?: (items: FileItem[]) => void;
  onCompress?: (items: FileItem[]) => void;
  onExtract?: (items: FileItem[]) => void;
  onMove?: (items: FileItem[]) => void;
  onDelete?: (items: FileItem[]) => void;
  onClearSelection?: () => void;
}

// Check if file is a compressed archive
const isArchiveFile = (fileName: string): boolean => {
  const archiveExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'];
  const lowerName = fileName.toLowerCase();
  return archiveExtensions.some(ext => lowerName.endsWith(ext));
};

export const FileSelectionActions = ({
  selectedItems,
  onCopy,
  onCut,
  onDownload,
  onCompress,
  onExtract,
  onMove,
  onDelete,
  onClearSelection,
}: FileSelectionActionsProps) => {
  if (selectedItems.length === 0) {
    return null;
  }

  const hasArchiveFiles = selectedItems.some(item => item.type === "file" && isArchiveFile(item.name));

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium">
        {selectedItems.length} mục đã chọn
      </span>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopy?.(selectedItems)}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Sao chép
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCut?.(selectedItems)}
            className="gap-2"
          >
            <Scissors className="h-4 w-4" />
            Cắt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload?.(selectedItems)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Tải xuống
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMove?.(selectedItems)}
            className="gap-2"
          >
            <Folder className="h-4 w-4" />
            Di chuyển
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCompress?.(selectedItems)}
            className="gap-2"
          >
            <Archive className="h-4 w-4" />
            Nén
          </Button>
          {hasArchiveFiles && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const archiveFiles = selectedItems.filter(item => item.type === "file" && isArchiveFile(item.name));
                onExtract?.(archiveFiles);
              }}
              className="gap-2"
            >
              <FileArchive className="h-4 w-4" />
              Giải nén
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete?.(selectedItems)}
            className="gap-2 text-white"
          >
            <Trash2 className="h-4 w-4" />
            Xóa
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};


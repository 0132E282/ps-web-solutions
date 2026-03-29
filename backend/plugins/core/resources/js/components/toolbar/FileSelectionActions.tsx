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

interface ActionConfig {
  label: string;
  icon: any;
  onClick: (items: FileItem[]) => void;
  variant?: "outline" | "destructive" | "default" | "ghost";
  className?: string;
  show?: boolean;
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

  const actions: ActionConfig[] = [
    {
      label: "Sao chép",
      icon: Copy,
      onClick: onCopy!,
      show: !!onCopy,
    },
    {
      label: "Cắt",
      icon: Scissors,
      onClick: onCut!,
      show: !!onCut,
    },
    {
      label: "Tải xuống",
      icon: Download,
      onClick: onDownload!,
      show: !!onDownload,
    },
    {
      label: "Di chuyển",
      icon: Folder,
      onClick: onMove!,
      show: !!onMove,
    },
    {
      label: "Nén",
      icon: Archive,
      onClick: onCompress!,
      show: !!onCompress,
    },
    {
      label: "Giải nén",
      icon: FileArchive,
      onClick: (items) => {
        const archiveFiles = items.filter(item => item.type === "file" && isArchiveFile(item.name));
        onExtract?.(archiveFiles);
      },
      show: !!onExtract && hasArchiveFiles,
    },
    {
      label: "Xóa",
      icon: Trash2,
      onClick: onDelete!,
      variant: "destructive",
      className: "text-white",
      show: !!onDelete,
    },
  ];

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium">
        {selectedItems.length} mục đã chọn
      </span>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          {actions
            .filter((action) => action.show !== false)
            .map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                onClick={() => action.onClick(selectedItems)}
                className={`gap-2 ${action.className || ""}`}
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
        </div>
        {onClearSelection && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};


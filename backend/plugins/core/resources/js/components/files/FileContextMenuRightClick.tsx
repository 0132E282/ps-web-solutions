import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@core/components/ui/context-menu";
import { Copy, Scissors, Download, Archive, Trash2, Folder, FileArchive, FolderPlus, Edit, Upload } from "lucide-react";
import type { FileItem } from "./types";

interface FileContextMenuRightClickProps {
  items: FileItem[];
  children: React.ReactNode;
  onCopy?: (items: FileItem[]) => void;
  onCut?: (items: FileItem[]) => void;
  onDownload?: (items: FileItem[]) => void;
  onCompress?: (items: FileItem[]) => void;
  onExtract?: (items: FileItem[]) => void;
  onMove?: (items: FileItem[]) => void;
  onRename?: (item: FileItem) => void;
  onDelete?: (items: FileItem[]) => void;
  onCreateFolder?: () => void;
  onUpload?: () => void;
}

// Check if file is a compressed archive
const isArchiveFile = (fileName: string): boolean => {
  const archiveExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'];
  const lowerName = fileName.toLowerCase();
  return archiveExtensions.some(ext => lowerName.endsWith(ext));
};

export const FileContextMenuRightClick = ({
  items,
  children,
  onCopy,
  onCut,
  onDownload,
  onCompress,
  onExtract,
  onMove,
  onRename,
  onDelete,
  onCreateFolder,
  onUpload,
}: FileContextMenuRightClickProps) => {
  const hasSelectedItems = items.length > 0;
  const hasSingleItem = items.length === 1;
  const hasArchiveFiles = items.some(item => item.type === "file" && isArchiveFile(item.name));

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="w-full h-full select-none">{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {hasSelectedItems ? (
          <>
            <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
              {items.length} mục đã chọn
            </div>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onCopy?.(items)}
              className="cursor-pointer"
            >
              <Copy className="h-4 w-4 mr-2" />
              Sao chép
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onCut?.(items)}
              className="cursor-pointer"
            >
              <Scissors className="h-4 w-4 mr-2" />
              Cắt
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onDownload?.(items)}
              className="cursor-pointer"
            >
              <Download className="h-4 w-4 mr-2" />
              Tải xuống
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onMove?.(items)}
              className="cursor-pointer"
            >
              <Folder className="h-4 w-4 mr-2" />
              Di chuyển
            </ContextMenuItem>
            {hasSingleItem && items[0] && (
              <ContextMenuItem
                onClick={() => {
                  const firstItem = items[0];
                  if (firstItem) {
                    onRename?.(firstItem);
                  }
                }}
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2" />
                Đổi tên
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onCompress?.(items)}
              className="cursor-pointer"
            >
              <Archive className="h-4 w-4 mr-2" />
              Nén
            </ContextMenuItem>
            {hasArchiveFiles && (
              <ContextMenuItem
                onClick={() => {
                  const archiveFiles = items.filter(item => item.type === "file" && isArchiveFile(item.name));
                  onExtract?.(archiveFiles);
                }}
                className="cursor-pointer"
              >
                <FileArchive className="h-4 w-4 mr-2" />
                Giải nén
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onDelete?.(items)}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuItem
              onClick={() => onCreateFolder?.()}
              className="cursor-pointer"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Tạo folder
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpload?.()}
              className="cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              Tải lên
            </ContextMenuItem>
            <ContextMenuSeparator />
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              Không có mục nào được chọn
            </div>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};


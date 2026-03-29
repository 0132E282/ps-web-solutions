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

interface ActionConfig {
  label?: string;
  icon?: any;
  onClick?: () => void;
  show?: boolean;
  className?: string;
  separator?: boolean;
}

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

  const selectionActions: ActionConfig[] = [
    { label: "Sao chép", icon: Copy, onClick: () => onCopy?.(items), show: !!onCopy },
    { label: "Cắt", icon: Scissors, onClick: () => onCut?.(items), show: !!onCut },
    { label: "Tải xuống", icon: Download, onClick: () => onDownload?.(items), show: !!onDownload },
    { label: "Di chuyển", icon: Folder, onClick: () => onMove?.(items), show: !!onMove },
    { 
      label: "Đổi tên", 
      icon: Edit, 
      onClick: () => items[0] && onRename?.(items[0]), 
      show: !!onRename && hasSingleItem 
    },
    { separator: true },
    { label: "Nén", icon: Archive, onClick: () => onCompress?.(items), show: !!onCompress },
    { 
      label: "Giải nén", 
      icon: FileArchive, 
      onClick: () => {
        const archiveFiles = items.filter(item => item.type === "file" && isArchiveFile(item.name));
        onExtract?.(archiveFiles);
      }, 
      show: !!onExtract && hasArchiveFiles 
    },
    { separator: true },
    { 
      label: "Xóa", 
      icon: Trash2, 
      onClick: () => onDelete?.(items), 
      show: !!onDelete,
      className: "text-destructive focus:text-destructive" 
    },
  ];

  const globalActions: ActionConfig[] = [
    { label: "Tạo folder", icon: FolderPlus, onClick: () => onCreateFolder?.(), show: !!onCreateFolder },
    { label: "Tải lên", icon: Upload, onClick: () => onUpload?.(), show: !!onUpload },
  ];

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
            {selectionActions.map((action, index) => 
              action.separator ? (
                <ContextMenuSeparator key={`sep-${index}`} />
              ) : action.show ? (
                <ContextMenuItem
                  key={action.label}
                  onClick={action.onClick}
                  className={`cursor-pointer ${action.className || ""}`}
                >
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.label}
                </ContextMenuItem>
              ) : null
            )}
          </>
        ) : (
          <>
            {globalActions.map((action) => 
              action.show && (
                <ContextMenuItem
                  key={action.label}
                  onClick={action.onClick}
                  className="cursor-pointer"
                >
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.label}
                </ContextMenuItem>
              )
            )}
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


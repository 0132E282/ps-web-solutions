import { useCallback, useMemo, memo } from "react";
import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@core/components/ui/dropdown-menu";
import { Download, Edit, Copy, Trash2, Folder } from "lucide-react";
import type { FileItem } from "./types";

interface FileContextMenuProps {
  item: FileItem;
  children: React.ReactNode;
  onDownload?: (item: FileItem) => void;
  onRename?: (item: FileItem) => void;
  onMove?: (item: FileItem) => void;
  onDuplicate?: (item: FileItem) => void;
  onDelete?: (item: FileItem) => void;
}

const stopPropagation = (e: React.MouseEvent) => {
  e.stopPropagation();
};

export const FileContextMenu = memo(({
  item,
  children,
  onDownload,
  onRename,
  onMove,
  onDuplicate,
  onDelete,
}: FileContextMenuProps) => {
  const [open, setOpen] = React.useState(false);
  const handleMenuAction = useCallback((action?: (item: FileItem) => void) => {
    if (action) {
      action(item);
    }
  }, [item]);

  const menuItems = useMemo(() => {
    const items: Array<{
      id: string;
      icon: React.ReactNode;
      label: string;
      onClick: () => void;
      className?: string;
      show?: boolean;
    }> = [
      {
        id: "download",
        icon: <Download className="h-4 w-4" />,
        label: "Tải",
        onClick: () => handleMenuAction(onDownload),
        show: item.type === "file",
      },
      {
        id: "rename",
        icon: <Edit className="h-4 w-4" />,
        label: "Đổi tên",
        onClick: () => handleMenuAction(onRename),
      },
      {
        id: "duplicate",
        icon: <Copy className="h-4 w-4" />,
        label: "Nhân bản",
        onClick: () => handleMenuAction(onDuplicate),
      },
      {
        id: "move",
        icon: <Folder className="h-4 w-4" />,
        label: "Di chuyển",
        onClick: () => handleMenuAction(onMove),
      },
      {
        id: "delete",
        icon: <Trash2 className="h-4 w-4" />,
        label: "Xóa",
        onClick: () => handleMenuAction(onDelete),
        className: "text-destructive focus:text-destructive",
      },
    ];

    return items.filter(item => item.show !== false);
  }, [item.type, handleMenuAction, onDownload, onRename, onDuplicate, onMove, onDelete]);

  const wrapperProps = useMemo(() => ({
    "data-context-menu-wrapper": true,
    className: "relative z-50",
    style: { pointerEvents: 'auto' as const },
  }), []);

  // Don't add onClick handler - let DropdownMenuTrigger handle it with asChild
  // The shouldIgnoreClick in FileItem will prevent Card onClick from firing

  const contentProps = useMemo(() => ({
    align: "end" as const,
    onClick: stopPropagation,
    onMouseDown: stopPropagation,
    className: "z-50",
  }), []);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
  }, []);

  // Clone children and add onClick handler to stop propagation
  // Radix UI DropdownMenuTrigger will handle opening/closing the menu
  const triggerChildren = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          // Preserve original onClick if it exists
          const originalOnClick = (children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>).props.onClick;
          if (originalOnClick) {
            originalOnClick(e);
          }
        },
      })
    : children;

  return (
    <div {...wrapperProps}>
      <DropdownMenu modal={true} open={open} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          {triggerChildren}
        </DropdownMenuTrigger>
        <DropdownMenuContent {...contentProps}>
          {menuItems.map((menuItem, index) => {
            const isDownload = menuItem.id === "download";
            const isDelete = menuItem.id === "delete";
            const showSeparatorAfter = isDownload;
            const showSeparatorBefore = isDelete && index > 0;
            
            return (
              <div key={menuItem.id}>
                {showSeparatorBefore && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={menuItem.onClick}
                  className={`cursor-pointer ${menuItem.className || ""}`}
                >
                  {menuItem.icon}
                  {menuItem.label}
                </DropdownMenuItem>
                {showSeparatorAfter && <DropdownMenuSeparator />}
              </div>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

FileContextMenu.displayName = "FileContextMenu";


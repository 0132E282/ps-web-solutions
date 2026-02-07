import { memo, useCallback, useMemo, useRef } from "react";
import { Card } from "@core/components/ui/card";
import { Button } from "@core/components/ui/button";
import { Checkbox } from "@core/components/ui/checkbox";
import { Folder, MoreVertical } from "lucide-react";
import type { FileItem as FileItemType } from "./types";
import { FilePreview } from "./FilePreview";
import { cn } from "@core/lib/utils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@core/components/ui/dropdown-menu";

interface FileItemProps {
  item: FileItemType;
  viewMode: "grid" | "list";
  selected?: boolean;
  onSelect?: (item: FileItemType, selected: boolean) => void;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDownload?: (item: FileItemType) => void;
  onRename?: (item: FileItemType) => void;
  onMoveItem?: (item: FileItemType) => void;
  onMoveItems?: (items: FileItemType[]) => void;
  onDuplicate?: (item: FileItemType) => void;
  onDelete?: (item: FileItemType) => void;
}

const shouldIgnoreClick = (e: React.MouseEvent): boolean => {
  const target = e.target as HTMLElement;
  return !!(
    target.closest('[data-slot="dropdown-menu"]') ||
    target.closest('[data-slot="dropdown-menu-trigger"]') ||
    target.closest('[data-slot="checkbox"]') ||
    target.closest('[role="menuitem"]') ||
    target.closest('[role="menu"]') ||
    target.closest('[data-context-menu-wrapper]') ||
    target.closest('[data-context-menu-button]') ||
    target.closest('button[data-context-menu-button]')
  );
};

const ContextMenuButton = memo(({
  className,
  iconSize = "h-4 w-4",
}: {
  className?: string;
  iconSize?: string;
}) => (
  <Button
    variant="ghost"
    size="icon"
    type="button"
    data-context-menu-button
    className={cn(
      "relative z-50 pointer-events-auto",
      className
    )}
  >
    <MoreVertical className={iconSize} />
  </Button>
));

ContextMenuButton.displayName = "ContextMenuButton";

const getFileUrl = (item: FileItemType, preferAbsolute = false): string | undefined => {
  if (preferAbsolute) {
    return item.absolute_url || item.path || item.thumbnail;
  }
  return item.path || item.absolute_url || item.thumbnail;
};

export const FileItem = memo(({
  item,
  viewMode,
  selected = false,
  onSelect,
  onClick,
  onDoubleClick,
  onMouseDown,
  onDownload,
  onRename,
  onMoveItem,
  onDuplicate,
  onDelete,
}: FileItemProps) => {
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDoubleClickRef = useRef(false);

  const handleCheckboxChange = useCallback((checked: boolean) => {
    onSelect?.(item, checked);
  }, [onSelect, item]);

  const handleItemClick = useCallback((e: React.MouseEvent) => {
    if (shouldIgnoreClick(e)) return;
    
    // Clear any existing timer
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    // If it's a folder, delay the click to allow double click to work
    if (item.type === "folder") {
      clickTimerRef.current = setTimeout(() => {
        if (!isDoubleClickRef.current) {
          onClick?.(e);
        }
        isDoubleClickRef.current = false;
      }, 300); // Delay to detect double click
    } else {
      onClick?.(e);
    }
  }, [onClick, item]);

  const handleItemDoubleClick = useCallback((e: React.MouseEvent) => {
    if (shouldIgnoreClick(e)) return;
    
    // Cancel single click
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    
    isDoubleClickRef.current = true;
    onDoubleClick?.(e);
  }, [onDoubleClick]);

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const cardBaseClasses = useMemo(() => cn(
    "group cursor-pointer transition-shadow hover:shadow-md select-none",
    selected && "ring-2 ring-primary bg-primary/5"
  ), [selected]);

  const filePreviewProps = useMemo(() => ({
    alt: item.name,
    name: item.name,
    extension: item.extension,
    mimeType: item.mime_type,
  }), [item.name, item.extension, item.mime_type]);

  const checkbox = useMemo(() => onSelect ? (
    <Checkbox
      checked={selected}
      onCheckedChange={handleCheckboxChange}
      onClick={handleCheckboxClick}
      className="hidden"
    />
  ) : null, [onSelect, selected, handleCheckboxChange, handleCheckboxClick]);

  const itemMenu = useMemo(() => (
    <div className="relative z-50" style={{ pointerEvents: 'auto' }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ContextMenuButton className={viewMode === "list" ? "h-8 w-8" : "h-6 w-6 shrink-0"} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {item.type === "file" && (
            <DropdownMenuItem onClick={() => onDownload?.(item)}>Download</DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onRename?.(item)}>Rename</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onMoveItem?.(item)}>Move</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate?.(item)}>Duplicate</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete?.(item)}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ), [item, viewMode, onDownload, onRename, onMoveItem, onDuplicate, onDelete]);

  // Folder layout
  if (item.type === "folder") {
    return (
      <Card
        className={cn(cardBaseClasses, "py-4")}
        onClick={handleItemClick}
        onDoubleClick={handleItemDoubleClick}
        onMouseDown={onMouseDown}
      >
        <div className="file-manager-item-header flex items-center gap-2 px-3 relative">
          {checkbox}
          <Folder className="h-5 w-5 text-blue-500 shrink-0" />
          <span className="text-sm truncate flex-1" title={item.name}>
            {item.name}
          </span>
          {itemMenu}
        </div>
      </Card>
    );
  }

  // File grid view
  if (viewMode === "grid") {
    const fileUrl = getFileUrl(item, true);
    return (
      <Card
        className={cn(cardBaseClasses, "relative p-2 flex flex-col gap-2 border")}
        onClick={handleItemClick}
        onDoubleClick={handleItemDoubleClick}
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center justify-between relative">
          <p className="text-xs text-start truncate w-full flex-1" title={item.name}>
            {item.name}
          </p>
          {itemMenu}
        </div>
        <div className="flex flex-col items-center justify-center rounded-md overflow-hidden">
          <FilePreview 
            url={fileUrl}
            {...filePreviewProps}
            size="lg"
          />
        </div>
      </Card>
    );
  }

  // File list view
  const fileUrl = getFileUrl(item, false);
  return (
    <Card
      className={cn(cardBaseClasses, "flex items-center gap-4 p-4")}
      onClick={handleItemClick}
      onDoubleClick={handleItemDoubleClick}
    >
      {checkbox}
      <FilePreview 
        url={fileUrl}
        {...filePreviewProps}
        size="md"
      />
      <p className="flex-1 truncate" title={item.name}>
        {item.name}
      </p>
      {itemMenu}
    </Card>
  );
});

FileItem.displayName = "FileItem";

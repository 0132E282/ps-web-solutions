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
          <Button
            variant="ghost"
            size="icon"
            type="button"
            data-context-menu-button
            className="h-8 w-8 bg-transparent text-gray-500 hover:bg-transparent hover:text-gray-900 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 transition-none [&:hover]:bg-transparent"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {item.type === "file" && (
            <DropdownMenuItem onClick={() => onDownload?.(item)}>Download</DropdownMenuItem>
          )}
          {item.type === "file" && (item.absolute_url || item.path) && (
            <DropdownMenuItem onClick={() => {
              const url = item.absolute_url || item.path || "";
              navigator.clipboard.writeText(url);
            }}>
              Copy path
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onRename?.(item)}>Rename</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onMoveItem?.(item)}>Move</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate?.(item)}>Duplicate</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete?.(item)}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ), [item, onDownload, onRename, onMoveItem, onDuplicate, onDelete]);

  // Folder layout
  if (item.type === "folder") {
    return (
      <Card
        className={cn(cardBaseClasses, "p-0 overflow-hidden")}
        onClick={handleItemClick}
        onDoubleClick={handleItemDoubleClick}
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center gap-3 px-3 py-2.5">
          {checkbox}
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-blue-50 shrink-0">
            <Folder className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" title={item.name}>{item.name}</p>
            {item.createdAt && (
              <p className="text-xs text-muted-foreground">{item.createdAt}</p>
            )}
          </div>
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
        className={cn(cardBaseClasses, "relative p-2 border-muted rounded-xl")}
        onClick={handleItemClick}
        onDoubleClick={handleItemDoubleClick}
        onMouseDown={onMouseDown}
      >
        {/* Top: name + menu */}
        <div className="flex justify-between items-start">
          <div className="text-xs text-muted-foreground truncate max-w-[70%]" title={item.name}>
            {item.name}
          </div>
          <div className="absolute top-1 right-1 z-10">
            {itemMenu}
          </div>
        </div>
        {/* Thumbnail */}
        <div className="relative aspect-square mt-2 flex items-center justify-center bg-muted/30 rounded w-full overflow-hidden">
          <FilePreview
            url={fileUrl}
            {...filePreviewProps}
            size="lg"
            className="w-full h-full"
          />
          {(item.size || item.createdAt) && (
            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none flex gap-1.5">
              {item.size && <span>{item.size}</span>}
              {item.size && item.createdAt && <span className="opacity-50">|</span>}
              {item.createdAt && <span>{item.createdAt}</span>}
            </div>
          )}
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

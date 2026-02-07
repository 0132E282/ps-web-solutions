import { useState, useRef, useCallback, useMemo, memo } from "react";
import type { FileItem, SortBy, SortOrder } from "./types";
import { FileItem as FileItemComponent } from "./FileItem";

interface FileGridProps {
  items: FileItem[];
  selectedIds?: Set<string>;
  onSelect?: (item: FileItem, selected: boolean) => void;
  onSelectRange?: (items: FileItem[]) => void;
  onItemClick?: (item: FileItem, e: React.MouseEvent) => void;
  onItemDoubleClick?: (item: FileItem, e: React.MouseEvent) => void;
  onDownload?: (item: FileItem) => void;
  onRename?: (item: FileItem) => void;
  onMoveItems?: (items: FileItem[]) => void;
  onDuplicate?: (item: FileItem) => void;
  onDelete?: (item: FileItem) => void;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  onSort?: (column: "name" | "size" | "date") => void;
}

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export const FileGrid = memo(({
  items,
  selectedIds,
  onSelect,
  onSelectRange,
  onItemClick,
  onItemDoubleClick,
  onDownload,
  onRename,
  onMoveItems,
  onDuplicate,
  onDelete,
}: FileGridProps) => {
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize filtered items to avoid re-filtering on every render
  const filteredFolders = useMemo(
    () => items.filter((item) => item.type === "folder"),
    [items]
  );
  const filteredFiles = useMemo(
    () => items.filter((item) => item.type === "file"),
    [items]
  );

  // Create items map for O(1) lookup instead of O(n) findIndex
  const itemsMap = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item, index) => {
      map.set(item.id, index);
    });
    return map;
  }, [items]);

  const handleItemClick = useCallback((item: FileItem, index: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastSelectedIndex !== null && onSelectRange) {
      // Range selection
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeItems = items.slice(start, end + 1);
      onSelectRange(rangeItems);
    } else {
      // Single selection toggle - only toggle the clicked item
      if (onSelect) {
        const isSelected = selectedIds?.has(item.id);
        onSelect(item, !isSelected);
      }
      setLastSelectedIndex(index);
    }
    onItemClick?.(item, e);
  }, [items, lastSelectedIndex, onSelect, onSelectRange, onItemClick, selectedIds]);

  const getItemElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll('[data-file-item]')) as HTMLElement[];
  }, []);

  const getItemsInBox = useCallback((box: SelectionBox): FileItem[] => {
    if (!containerRef.current) return [];
    
    const itemElements = getItemElements();
    const selectedItems: FileItem[] = [];
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const minX = Math.min(box.startX, box.endX);
    const maxX = Math.max(box.startX, box.endX);
    const minY = Math.min(box.startY, box.endY);
    const maxY = Math.max(box.startY, box.endY);

    // Use itemsMap for O(1) lookup instead of O(n) find
    itemElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const itemId = el.getAttribute('data-file-item');
      if (!itemId) return;
      
      const index = itemsMap.get(itemId);
      const item = index !== undefined ? items[index] : null;
      
      if (item) {
        // Calculate position relative to container
        const elX = rect.left - containerRect.left;
        const elY = rect.top - containerRect.top;
        const elRight = elX + rect.width;
        const elBottom = elY + rect.height;
        
        // Check if element intersects with selection box
        if (elRight >= minX && elX <= maxX && elBottom >= minY && elY <= maxY) {
          selectedItems.push(item);
        }
      }
    });

    return selectedItems;
  }, [items, itemsMap, getItemElements]);

  const clearAllSelections = useCallback(() => {
    if (onSelect && selectedIds && selectedIds.size > 0) {
      // Clear all selections - batch updates
      const selectedItems = items.filter((item) => selectedIds.has(item.id));
      selectedItems.forEach((item) => {
        onSelect(item, false);
      });
    }
  }, [onSelect, selectedIds, items]);

  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start drag selection if clicking on empty space
    if (e.button === 0 && (e.target as HTMLElement).closest('[data-file-item]') === null) {
      // Clear selection when clicking on empty space
      clearAllSelections();
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setIsSelecting(true);
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setDragStartPos({ x, y });
        setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
      }
    }
  }, [clearAllSelections]);

  const handleContainerMouseMove = useCallback((e: React.MouseEvent) => {
    if (isSelecting && dragStartPos && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setSelectionBox({
        startX: dragStartPos.x,
        startY: dragStartPos.y,
        endX: x,
        endY: y,
      });
    }
  }, [isSelecting, dragStartPos]);

  const handleContainerMouseUp = useCallback(() => {
    if (isSelecting && selectionBox && onSelectRange) {
      const selectedItems = getItemsInBox(selectionBox);
      if (selectedItems.length > 0) {
        onSelectRange(selectedItems);
      }
    }
    setIsSelecting(false);
    setSelectionBox(null);
    setDragStartPos(null);
  }, [isSelecting, selectionBox, onSelectRange, getItemsInBox]);

  // Render item helper to avoid code duplication
  const renderItem = useCallback((item: FileItem) => {
    const itemIndex = itemsMap.get(item.id) ?? -1;
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleItemClick(item, itemIndex, e);
    };
    const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onItemDoubleClick?.(item, e);
    };
    const handleMoveItem = onMoveItems ? () => onMoveItems([item]) : undefined;

    return (
      <div key={item.id} data-file-item={item.id}>
        <FileItemComponent
          item={item}
          viewMode="grid"
          selected={selectedIds?.has(item.id)}
          onSelect={onSelect}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onDownload={onDownload}
          onRename={onRename}
          onMoveItem={handleMoveItem}
          onMoveItems={onMoveItems}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </div>
    );
  }, [itemsMap, handleItemClick, onItemDoubleClick, onMoveItems, selectedIds, onSelect, onDownload, onRename, onDuplicate, onDelete]);

  // Render section helper
  const renderSection = useCallback((
    title: string,
    items: FileItem[],
    gridCols: 5 | 6 = 5
  ) => {
    if (items.length === 0) return null;
    
    const gridClass = gridCols === 6 ? "grid-cols-6" : "grid-cols-5";
    
    return (
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          {title} ({items.length})
        </h3>
        <div className={`grid ${gridClass} gap-4`}>
          {items.map(renderItem)}
        </div>
      </div>
    );
  }, [renderItem]);

  return (
    <div
      ref={containerRef}
      className="space-y-6 relative select-none"
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      onMouseLeave={handleContainerMouseUp}
    >
      {selectionBox && (
        <div
          className="absolute border-2 border-primary bg-primary/10 pointer-events-none z-50"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.endX),
            top: Math.min(selectionBox.startY, selectionBox.endY),
            width: Math.abs(selectionBox.endX - selectionBox.startX),
            height: Math.abs(selectionBox.endY - selectionBox.startY),
          }}
        />
      )}
      {renderSection("Thư mục", filteredFolders, 5)}
      {renderSection("Tệp", filteredFiles, 5)}
    </div>
  );
});

FileGrid.displayName = "FileGrid";


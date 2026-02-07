import { useState, useMemo, useCallback } from "react";
import { Button } from "@core/components/ui/button";
import { Checkbox } from "@core/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@core/components/ui/table";
import { Folder, Image as ImageIcon, MoreVertical, ArrowUpDown } from "lucide-react";
import type { FileItem } from "./types";
import type { SortBy } from "@core/types/files";
import { FileContextMenu } from "./FileContextMenu";
import { cn } from "@core/lib/utils";

interface FileListProps {
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
  onSort?: (column: SortBy) => void;
}

export const FileList = ({
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
  sortBy,
  onSort,
}: FileListProps) => {
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const { fileCount, folderCount } = useMemo(() => {
    let files = 0;
    let folders = 0;
    for (const item of items) {
      if (item.type === "file") files++;
      else folders++;
    }
    return { fileCount: files, folderCount: folders };
  }, [items]);

  const handleTableClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('tr') === null && onSelect && selectedIds?.size) {
      selectedIds.forEach((id) => {
        const item = items.find((i) => i.id === id);
        if (item) onSelect(item, false);
      });
    }
  }, [onSelect, selectedIds, items]);

  const handleRowClick = useCallback((item: FileItem, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (e.shiftKey && lastSelectedIndex !== null && onSelectRange) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      onSelectRange(items.slice(start, end + 1));
    } else if (onSelect) {
      onSelect(item, !selectedIds?.has(item.id));
      setLastSelectedIndex(index);
    }
    
    onItemClick?.(item, e);
  }, [lastSelectedIndex, onSelectRange, onSelect, selectedIds, items, onItemClick]);

  const handleRowDoubleClick = useCallback((item: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    onItemDoubleClick?.(item, e);
  }, [onItemDoubleClick]);

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Không có mục nào
      </div>
    );
  }

  return (
    <div className="rounded-md border select-none" onClick={handleTableClick}>
      <Table>
        <TableHeader>
          <TableRow>
            {onSelect && <TableHead className="w-[50px] hidden" />}
            <TableHead className="w-[50px]" />
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 -ml-3"
                onClick={() => onSort?.("name")}
              >
                Tên
                {sortBy === "name" && <ArrowUpDown className="ml-2 h-3 w-3" />}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 -ml-3"
                onClick={() => onSort?.("size")}
              >
                Kích thước
                {sortBy === "size" && <ArrowUpDown className="ml-2 h-3 w-3" />}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 -ml-3"
                onClick={() => onSort?.("created_at")}
              >
                Ngày tạo
                {sortBy === "created_at" && <ArrowUpDown className="ml-2 h-3 w-3" />}
              </Button>
            </TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow
              key={item.id}
              className={cn(
                "cursor-pointer",
                selectedIds?.has(item.id) && "bg-primary/5 ring-2 ring-primary"
              )}
              onClick={(e) => handleRowClick(item, index, e)}
              onDoubleClick={(e) => handleRowDoubleClick(item, e)}
            >
              {onSelect && (
                <TableCell onClick={stopPropagation} className="hidden">
                  <Checkbox
                    checked={selectedIds?.has(item.id)}
                    onCheckedChange={(checked) => onSelect(item, checked === true)}
                  />
                </TableCell>
              )}
              <TableCell>
                {item.type === "folder" ? (
                  <Folder className="h-5 w-5 text-blue-500" />
                ) : item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="h-8 w-8 object-cover rounded"
                  />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {item.size || "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {item.createdAt || "-"}
              </TableCell>
              <TableCell>
                <FileContextMenu
                  item={item}
                  onDownload={onDownload}
                  onRename={onRename}
                  onMove={onMoveItems ? () => onMoveItems([item]) : undefined}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={stopPropagation}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </FileContextMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={onSelect ? 6 : 5} className="text-sm text-muted-foreground py-4">
              {fileCount} tệp {folderCount} thư mục
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};


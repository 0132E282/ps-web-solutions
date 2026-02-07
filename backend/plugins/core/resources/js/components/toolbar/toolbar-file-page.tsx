import { Button } from "@core/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@core/components/ui/dropdown-menu";
import { ChevronUp, ChevronDown, Grid3x3, List } from "lucide-react";
import type { SortBy, SortOrder, ViewMode, FileItem } from "@core/types";
import { FileSelectionActions } from "./FileSelectionActions";

interface FileToolbarProps {
  sortBy: SortBy;
  sortOrder: SortOrder;
  viewMode: ViewMode;
  onSortChange: (sortBy: SortBy) => void;
  onViewModeChange: (viewMode: ViewMode) => void;
  selectedItems?: FileItem[];
  onCopy?: (items: FileItem[]) => void;
  onCut?: (items: FileItem[]) => void;
  onDownload?: (items: FileItem[]) => void;
  onCompress?: (items: FileItem[]) => void;
  onExtract?: (items: FileItem[]) => void;
  onMove?: (items: FileItem[]) => void;
  onDelete?: (items: FileItem[]) => void;
  onClearSelection?: () => void;
}

const sortLabels: Record<SortBy, string> = {
  name: "Tên",
  date: "Ngày",
  size: "Kích thước",
};

export const FileToolbar = ({
  sortBy,
  sortOrder,
  viewMode,
  onSortChange,
  onViewModeChange,
  selectedItems = [],
  onCopy,
  onCut,
  onDownload,
  onCompress,
  onExtract,
  onMove,
  onDelete,
  onClearSelection,
}: FileToolbarProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <FileSelectionActions
        selectedItems={selectedItems}
        onCopy={onCopy}
        onCut={onCut}
        onDownload={onDownload}
        onCompress={onCompress}
        onExtract={onExtract}
        onMove={onMove}
        onDelete={onDelete}
        onClearSelection={onClearSelection}
      />

      <div className="flex items-center gap-2 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              {sortLabels[sortBy]}
              {sortOrder === "asc" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onSortChange("name")}>
              Tên
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("date")}>
              Ngày
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("size")}>
              Kích thước
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          size="icon"
          onClick={() => onViewModeChange("grid")}
        >
          <Grid3x3 className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="icon"
          onClick={() => onViewModeChange("list")}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};


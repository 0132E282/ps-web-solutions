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
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  viewMode?: ViewMode;
  onSortChange?: (sortBy: SortBy) => void;
  onViewModeChange?: (viewMode: ViewMode) => void;
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

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "name", label: "Tên" },
  { value: "last_modified", label: "Ngày" },
  { value: "size", label: "Kích thước" },
  { value: "type", label: "Loại" },
];

const VIEW_OPTIONS = [
  { value: "grid", icon: Grid3x3 },
  { value: "list", icon: List },
];

export const FileToolbar = ({
  sortBy = "name",
  sortOrder = "asc",
  viewMode = "grid",
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

      {(onSortChange || onViewModeChange) && (
        <div className="flex items-center gap-2 ml-auto">
          {onSortChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label || sortBy}
                  {sortOrder === "asc" ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onSortChange(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {onViewModeChange && (
            <div className="flex items-center gap-2">
              {VIEW_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={viewMode === option.value ? "default" : "outline"}
                  size="icon"
                  onClick={() => onViewModeChange(option.value as ViewMode)}
                >
                  <option.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


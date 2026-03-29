import { memo } from "react";
import { Button } from "@core/components/ui/button";
import { Input } from "@core/components/ui/input";
import { Upload, FolderPlus, Search, ChevronUp, ChevronDown, Grid3x3, List } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@core/components/ui/dropdown-menu";
import type { SortBy, SortOrder, ViewMode } from "@core/types/files";

interface FileHeaderProps {
  onBack?: () => void;
  onUpload?: () => void;
  onCreateFolder?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  viewMode?: ViewMode;
  onSortChange?: (sortBy: SortBy) => void;
  onViewModeChange?: (viewMode: ViewMode) => void;
}

const BUTTON_CLASS = "gap-2";

const sortLabels: Record<string, string> = {
  name: "Tên",
  date: "Ngày",
  size: "Kích thước",
  last_modified: "Ngày sửa đổi",
};

export const FileHeader = memo(({
  onUpload,
  onCreateFolder,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Tìm kiếm",
  sortBy = "name",
  sortOrder = "asc",
  viewMode = "grid",
  onSortChange,
  onViewModeChange,
}: FileHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex items-center gap-2">
        {onSortChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {sortLabels[sortBy] || sortBy}
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
              <DropdownMenuItem onClick={() => onSortChange("last_modified")}>
                Ngày sửa đổi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange("size")}>
                Kích thước
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {onViewModeChange && (
          <div className="flex items-center gap-2">
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
        )}

        {(onUpload || onCreateFolder) && (
          <div className="flex items-center gap-2 ml-2">
            {onUpload && (
              <Button
                className={BUTTON_CLASS}
                onClick={onUpload}
              >
                <Upload className="h-4 w-4" />
                Tải tệp
              </Button>
            )}
            {onCreateFolder && (
              <Button
                className={BUTTON_CLASS}
                onClick={onCreateFolder}
              >
                <FolderPlus className="h-4 w-4" />
                Tạo thư mục
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

FileHeader.displayName = "FileHeader";


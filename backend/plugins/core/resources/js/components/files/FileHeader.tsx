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

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "name", label: "Tên" },
  { value: "last_modified", label: "Ngày sửa đổi" },
  { value: "size", label: "Kích thước" },
];

const VIEW_OPTIONS: { value: ViewMode; icon: any }[] = [
  { value: "grid", icon: Grid3x3 },
  { value: "list", icon: List },
];

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
                onClick={() => onViewModeChange(option.value)}
              >
                <option.icon className="h-4 w-4" />
              </Button>
            ))}
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


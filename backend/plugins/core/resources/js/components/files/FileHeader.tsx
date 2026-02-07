import { memo } from "react";
import { Button } from "@core/components/ui/button";
import { Input } from "@core/components/ui/input";
import { Upload, FolderPlus, Search } from "lucide-react";

interface FileHeaderProps {
  onBack?: () => void;
  onUpload?: () => void;
  onCreateFolder?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

const BUTTON_CLASS = "gap-2";

export const FileHeader = memo(({
  onUpload,
  onCreateFolder,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Tìm kiếm",
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
        <Button
          className={BUTTON_CLASS}
          onClick={onUpload}
        >
          <Upload className="h-4 w-4" />
          Tải tệp
        </Button>
        <Button
          className={BUTTON_CLASS}
          onClick={onCreateFolder}
        >
          <FolderPlus className="h-4 w-4" />
          Tạo thư mục
        </Button>
      </div>
    </div>
  );
});

FileHeader.displayName = "FileHeader";


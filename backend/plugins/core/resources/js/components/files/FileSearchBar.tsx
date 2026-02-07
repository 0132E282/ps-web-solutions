import { Input } from "@core/components/ui/input";
import { Search } from "lucide-react";

interface FileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const FileSearchBar = ({
  value,
  onChange,
  placeholder = "Tìm kiếm",
}: FileSearchBarProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};


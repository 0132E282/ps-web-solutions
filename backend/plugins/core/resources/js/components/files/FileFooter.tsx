import type { FileItem } from "./types";

interface FileFooterProps {
  items: FileItem[];
}

export const FileFooter = ({ items }: FileFooterProps) => {
  const fileCount = items.filter((item) => item.type === "file").length;
  const folderCount = items.filter((item) => item.type === "folder").length;

  return (
    <div className="flex items-start justify-start py-4 text-sm text-muted-foreground">
      {fileCount} tệp {folderCount} thư mục
    </div>
  );
};


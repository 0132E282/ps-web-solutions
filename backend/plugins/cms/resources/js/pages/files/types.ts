export interface FileItem {
  id: string;
  name: string;
  type: "folder" | "file";
  thumbnail?: string;
  size?: string;
  createdAt?: string;
}

export type SortBy = "name" | "date" | "size";
export type SortOrder = "asc" | "desc";
export type ViewMode = "grid" | "list";



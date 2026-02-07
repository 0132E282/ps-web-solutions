export interface FileItem {
  id: string;
  name: string;
  type: "folder" | "file";
  thumbnail?: string;
  path?: string;
  absolute_url?: string;
  parent_id?: string | null;
  size?: string;
  extension?: string;
  mime_type?: string;
  createdAt?: string;
}

export type SortBy = "name" | "size" | "created_at";
export type SortOrder = "asc" | "desc";
export type ViewMode = "grid" | "list";


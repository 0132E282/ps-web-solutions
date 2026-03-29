export interface FileItem {
    id: string | number;
    name: string;
    type: 'file' | 'folder';
    path?: string;
    size?: number | string;
    url?: string;
    thumbnail?: string;
    extension?: string;
    mime_type?: string;
    last_modified?: string;
    created_at?: string;
    createdAt?: string;
    children?: FileItem[];
    parent_id?: string | number | null;
    absolute_url?: string;
    [key: string]: unknown;
}

export type SortBy = 'id' | 'name' | 'size' | 'last_modified' | 'created_at' | 'type' | 'date';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';

export interface FileItem {
    id: string | number;
    name: string;
    path: string;
    type: 'file' | 'folder';
    size?: number;
    url?: string;
    extension?: string;
    mime_type?: string;
    last_modified?: string;
    children?: FileItem[];
    [key: string]: unknown;
}

export type SortBy = 'name' | 'size' | 'last_modified' | 'type';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';

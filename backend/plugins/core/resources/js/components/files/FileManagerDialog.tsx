import { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@core/components/ui/dialog";
import { Button } from "@core/components/ui/button";
import { Input } from "@core/components/ui/input";
import { Label } from "@core/components/ui/label";
import { FileGrid } from "./FileGrid";
import { FileList } from "./FileList";
import { FileUploadDialog } from "./FileUploadDialog";
import { FileHeader } from "./FileHeader";
import { FileToolbar } from "@core/components/toolbar";
import type { FileItem, ViewMode } from "./types";
import type { SortBy } from "@core/types/files";
import { route } from "@core/lib/route";
import { axios } from "@core/lib/axios";
import { toast } from "sonner";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@core/components/ui/empty";
import { useDispatch, useSelector } from "react-redux";
import { fetchResourceRequest } from "@core/redux";
import { RootState } from "@core/redux/store";

interface FileManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  multiple?: boolean;
  acceptTypes?: ("file" | "folder")[];
  componentId?: string;
  onSelect?: (items: FileItem[]) => void;
  allowedFileTypes?: string[]; // Custom: filter by mime types or extensions (e.g., ['image/*', '.pdf'])
  maxFileSize?: number; // Custom: max file size in bytes
}

export const FileManagerDialog = ({
  open,
  onOpenChange,
  multiple = false,
  acceptTypes = ["file", "folder"],
  componentId,
  onSelect,
  allowedFileTypes,
  maxFileSize,
}: FileManagerDialogProps) => {
  const dispatch = useDispatch();
  // Use route name 'admin.files.index'
  const resourceName = "admin.files.index";
  const resourceState = useSelector((state: RootState) => state.resource[resourceName]);
  const rawItems = useMemo(() => (resourceState?.items || []) as unknown as FileItem[], [resourceState?.items]);
  const isLoading = resourceState?.loading || false;
  // Use backend pagination data if available to control page count?
  // Current implementation uses local page state and just fetches.

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  // Load files from API using Redux Saga
  const loadFiles = useCallback(() => {
    dispatch(fetchResourceRequest({
      resource: resourceName,
      params: {
        parent_id: currentFolderId,
        search: searchQuery || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        per_page: perPage,
      },
    }));
  }, [dispatch, currentFolderId, searchQuery, sortBy, sortOrder, page, perPage]);

  // Load files when dialog opens or dependencies change
  // Note: loadFiles depends on page/sort/search, so it will trigger when they change
  useEffect(() => {
    if (open) {
      loadFiles();
    }
  }, [open, loadFiles]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setCurrentFolderId(null);
      setSearchQuery("");
      setPage(1);
    }
  }, [open]);

  // Reset page when folder changes
  useEffect(() => {
    setPage(1);
  }, [currentFolderId]);

  // Apply custom filters on the raw items from Redux
  const items = useMemo(() => {
    let filtered = rawItems;

    // Filter items based on acceptTypes
    if (acceptTypes.length > 0 && !acceptTypes.includes("file") && !acceptTypes.includes("folder")) {
        filtered = [];
    } else if (acceptTypes.length === 1) {
        if (acceptTypes[0] === "file") {
            filtered = filtered.filter((item) => item.type === "file");
        } else if (acceptTypes[0] === "folder") {
            filtered = filtered.filter((item) => item.type === "folder");
        }
    }

    // Apply custom allowedFileTypes
    if (allowedFileTypes && allowedFileTypes.length > 0) {
        filtered = filtered.filter((item) => {
            if (item.type === "folder") return true;

            // Check mime type
            if (item.mime_type) {
                const matchesMime = allowedFileTypes.some((type) => {
                    if (type.endsWith("/*")) {
                        const baseType = type.split("/")[0];
                        return item.mime_type?.startsWith(baseType + "/");
                    }
                    return item.mime_type === type;
                });
                if (matchesMime) return true;
            }

            // Check extension
            if (item.extension) {
                const matchesExt = allowedFileTypes.some((type) => {
                    if (type.startsWith(".")) {
                        return item.extension?.toLowerCase() === type.toLowerCase().substring(1);
                    }
                    return false;
                });
                if (matchesExt) return true;
            }

            return false;
        });
    }

    // Filter by max file size
    if (maxFileSize) {
        filtered = filtered.filter((item) => {
            if (item.type === "folder") return true;
            if (!item.size) return true;
            const sizeInBytes = typeof item.size === 'number' ? item.size : parseInt(String(item.size), 10);
            return isNaN(sizeInBytes) || sizeInBytes <= maxFileSize;
        });
    }

    return filtered;
  }, [rawItems, acceptTypes, allowedFileTypes, maxFileSize]);

  // Handle item selection
  const handleSelect = useCallback((item: FileItem, selected: boolean) => {
    if (!multiple && selected) {
      // Single selection mode - clear previous selection
      setSelectedIds(new Set([item.id]));
    } else {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(item.id);
        } else {
          newSet.delete(item.id);
        }
        return newSet;
      });
    }
  }, [multiple]);

  // Handle folder navigation
  const handleItemClick = useCallback((item: FileItem) => {
    if (item.type === "folder") {
      setCurrentFolderId(item.id);
      setSelectedIds(new Set());
    }
  }, []);

  // Handle double click on folder
  const handleItemDoubleClick = useCallback((item: FileItem) => {
    if (item.type === "folder") {
      setCurrentFolderId(item.id);
      setSelectedIds(new Set());
    }
  }, []);

  // Get selected items
  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.has(item.id));
  }, [items, selectedIds]);

  // Handle sort for FileList
  const handleSort = useCallback((column: SortBy) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  }, [sortBy]);

  // Handle confirm selection
  const handleConfirm = useCallback(() => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    // Dispatch event for CKEditor plugin
    if (componentId) {
      const selectEvent = new CustomEvent("file-manager-selected-items", {
        bubbles: true,
        cancelable: true,
        detail: {
          componentId,
          items: selectedItems,
        },
      });
      document.dispatchEvent(selectEvent);
    }

    // Call onSelect callback if provided
    onSelect?.(selectedItems);

    // Close dialog
    onOpenChange(false);
  }, [selectedItems, componentId, onSelect, onOpenChange]);

  // Filter items based on search - client side secondary filter?
  // Current logic: server handles search via `searchQuery` param in loadFiles.
  // BUT the original component ALSO filtered client side.
  // It's safer to rely on server search if we are sending the param.
  // However, keeping this doesn't hurt if server returns exact matches.
  // Actually, if server search is fuzzy, client search might be stricter?
  // Let's assume server search is sufficient if searchQuery is passed.
  // But wait, the original component logic:
  // 1. Sends `search: searchQuery` to API.
  // 2. ALSO filters items via `filteredItems` memo.
  // This implies the API search might not be working or they want double filtering.
  // I will keep a light version: if items are coming from server based on search, we display them.
  // But the existing `filteredItems` memo:
  const finalDisplayItems = useMemo(() => {
    if (!searchQuery) return items;
    // If we trust server search, we just return items.
    // If we think server ignores search, we filter.
    // Given we send `search` in params, let's assume server filters.
    // But to minimize behavior change, I'll keep the client filter too.
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.extension?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);


  // Handle upload
  const handleUpload = useCallback(() => {
    setUploadDialogOpen(true);
  }, []);

  // Handle upload success
  const handleUploadSuccess = useCallback(() => {
    loadFiles();
  }, [loadFiles]);

  // Handle create folder
  const handleCreateFolder = useCallback(() => {
    setCreateFolderDialogOpen(true);
  }, []);

  // Handle create folder confirm
  const handleCreateFolderConfirm = useCallback(async () => {
    if (!newFolderName.trim()) {
      toast.error("Vui lòng nhập tên thư mục");
      return;
    }

    setCreatingFolder(true);
    try {
      await axios.post(route("admin.files.createFolder"), {
        name: newFolderName.trim(),
        parent_id: currentFolderId ? parseInt(currentFolderId) : null,
      });
      toast.success("Tạo thư mục thành công");
      setCreateFolderDialogOpen(false);
      setNewFolderName("");
      loadFiles();
    } catch (error: unknown) {

      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Lỗi khi tạo thư mục");
    } finally {
      setCreatingFolder(false);
    }
  }, [newFolderName, currentFolderId, loadFiles]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-full lg:max-w-6xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">Chọn File</DialogTitle>
          <DialogDescription>
            {multiple
              ? "Chọn một hoặc nhiều file để chèn"
              : "Chọn một file để chèn"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 gap-4">
          {/* Header with search, upload and create folder */}
          <FileHeader
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            onUpload={handleUpload}
            onCreateFolder={handleCreateFolder}
            searchPlaceholder="Tìm kiếm file..."
          />

          {/* Toolbar with view and sort controls */}
          <FileToolbar
            sortBy={sortBy}
            sortOrder={sortOrder}
            viewMode={viewMode}
            onSortChange={(newSortBy) => {
              if (sortBy === newSortBy) {
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
              } else {
                setSortBy(newSortBy);
                setSortOrder("asc");
              }
            }}
            onViewModeChange={setViewMode}
            selectedItems={[]}
          />

          {/* File list/grid */}
          <div className="flex-1 overflow-auto rounded-lg border bg-muted/5">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-3">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="text-sm text-muted-foreground">Đang tải file...</p>
                </div>
              </div>
            ) : finalDisplayItems.length === 0 ? (
              <Empty>
                <EmptyMedia>
                  <div className="rounded-full bg-muted p-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted-foreground"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle className="text-lg">Không tìm thấy file</EmptyTitle>
                  <EmptyDescription className="text-sm">
                    {searchQuery
                      ? "Thử điều chỉnh từ khóa tìm kiếm của bạn"
                      : "Chưa có file nào trong thư mục này"}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : viewMode === "grid" ? (
              <div className="p-6">
                <FileGrid
                  items={finalDisplayItems}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onItemClick={handleItemClick}
                  onItemDoubleClick={handleItemDoubleClick}
                />
              </div>
            ) : (
              <FileList
                items={finalDisplayItems}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onItemClick={handleItemClick}
                onItemDoubleClick={handleItemDoubleClick}
                sortBy={sortBy}
                onSort={handleSort}
              />
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              {selectedItems.length > 0 && `${selectedItems.length} file đã chọn`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button onClick={handleConfirm} disabled={selectedItems.length === 0}>
                Chèn {selectedItems.length > 0 ? `(${selectedItems.length})` : ""}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadSuccess={handleUploadSuccess}
        parentId={currentFolderId}
      />

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tạo thư mục mới</DialogTitle>
            <DialogDescription>
              Nhập tên cho thư mục mới
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Tên thư mục</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nhập tên thư mục..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !creatingFolder) {
                    handleCreateFolderConfirm();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateFolderDialogOpen(false);
                setNewFolderName("");
              }}
              disabled={creatingFolder}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateFolderConfirm} disabled={creatingFolder || !newFolderName.trim()}>
              {creatingFolder ? "Đang tạo..." : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

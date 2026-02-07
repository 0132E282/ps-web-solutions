import { useState, useEffect, useCallback } from "react";
import { router, usePage } from "@inertiajs/react";
import AppLayout from "@core/layouts/app-layout";
import {
  FileHeader,
  FileGrid,
  FileList,
  FileFooter,
  DuplicateDialog,
  RenameDialog,
  MoveDialog,
  FileContextMenuRightClick,
  FileUploadDialog,
} from "@core/components/files";
import { FileToolbar } from "@core/components/toolbar";
import type { FileItem as FileItemType, SortBy, ViewMode } from "@core/components/files/types";
import { route } from "@core/lib/route";
import { axios } from "@core/lib/axios";
import { toast } from "sonner";
import { Input } from "@core/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@core/components/ui/dialog";
import { Button } from "@core/components/ui/button";
import { Label } from "@core/components/ui/label";
import { Cloud } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@core/components/ui/empty";
import type { BreadcrumbItem } from "@core/types/common";

interface PageProps {
  items: FileItemType[];
  parentId: string | null;
  breadcrumbs?: BreadcrumbItem[];
  [key: string]: unknown;
}

const Index = () => {
  const { props } = usePage<PageProps>();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(props.parentId || null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [itemToDuplicate, setItemToDuplicate] = useState<FileItemType | null>(null);
  const [itemToRename, setItemToRename] = useState<FileItemType | null>(null);
  const [itemsToMove, setItemsToMove] = useState<FileItemType[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>(props.breadcrumbs || []);

  const items = props.items || [];

  const handleAxiosError = (error: unknown, defaultMessage: string) => {
    const err = error as { response?: { data?: { message?: string } } };
    toast.error(err?.response?.data?.message || defaultMessage);
  };

  const loadData = useCallback(() => {
    router.get(
        route("admin.files.index"),
      {
        parent_id: currentFolderId,
        search: searchQuery,
        sort_by: sortBy,
        sort_order: sortOrder,
      },
      {
        preserveState: true,
        preserveScroll: true,
        only: ["items", "breadcrumbs"],
        onSuccess: (page) => {
          if (page.props.breadcrumbs) {
            setBreadcrumbs(page.props.breadcrumbs as BreadcrumbItem[]);
          }
        },
      },
    );
  }, [currentFolderId, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
  };

  const handleTableSort = (column: "name" | "size" | "type" | "date") => {
    const sortMap: Record<"name" | "size" | "type" | "date", SortBy> = {
      name: "name",
      size: "size",
      type: "name",
      date: "date",
    };
    handleSort(sortMap[column]);
  };

  const handleItemClick = (item: FileItemType) => {
    handleSelect(item, !selectedIds.has(item.id));
  };

  const handleItemDoubleClick = (item: FileItemType) => {
    if (item.type === "folder") {
      setCurrentFolderId(item.id);
      setSelectedIds(new Set());
    } else {
      window.open(item.thumbnail || route("admin.files.download", { id: item.id }), "_blank");
    }
  };

  const handleBack = () => {
    if (currentFolderId) {
      const currentFolder = items.find((item) => item.id === currentFolderId);
      if (currentFolder) {
        setCurrentFolderId(null);
        setSelectedIds(new Set());
      }
    } else {
      router.visit("/dashboard");
    }
  };

  const handleDownload = (item: FileItemType) => {
    window.location.href = route("admin.files.download", { id: item.id });
  };

  const handleRename = (item: FileItemType) => {
    setItemToRename(item);
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = async (name: string) => {
    if (!itemToRename) return;

    setLoading(true);
    try {
      await axios.put(route("admin.files.rename", { id: itemToRename.id }), { name });
      toast.success("Đổi tên thành công");
      loadData();
      setRenameDialogOpen(false);
      setItemToRename(null);
    } catch (error: unknown) {
      handleAxiosError(error, "Lỗi khi đổi tên");
    } finally {
      setLoading(false);
    }
  };

  const handleMove = (item: FileItemType) => {
    handleMoveItems([item]);
  };

  const handleMoveItems = (items: FileItemType[]) => {
    setItemsToMove(items);
    setMoveDialogOpen(true);
  };

  const handleMoveConfirm = async (items: FileItemType[], targetFolderId: string | null) => {
    setLoading(true);
    try {
      await axios.post(route("admin.files.move"), {
        ids: items.map((item) => item.id),
        parent_id: targetFolderId ? parseInt(targetFolderId) : null,
      });
      toast.success("Di chuyển thành công");
      loadData();
      setMoveDialogOpen(false);
      setItemsToMove([]);
    } catch (error: unknown) {
      handleAxiosError(error, "Lỗi khi di chuyển");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadZip = (items: FileItemType[]) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = route("admin.files.downloadZip");
    form.style.display = "none";

    const idsInput = document.createElement("input");
    idsInput.type = "hidden";
    idsInput.name = "ids[]";
    items.forEach((item) => {
      const input = idsInput.cloneNode() as HTMLInputElement;
      input.value = item.id;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const handleCopy = () => {
    toast.info("Tính năng sao chép đang được phát triển");
  };

  const handleCut = () => {
    toast.info("Tính năng cắt đang được phát triển");
  };

  const handleCompress = async (items: FileItemType[]) => {
    setLoading(true);
    try {
      await axios.post(route("admin.files.compress"), {
        ids: items.map((item) => item.id),
      });
      toast.success("Nén thành công");
      loadData();
    } catch (error: unknown) {
      handleAxiosError(error, "Lỗi khi nén");
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async (items: FileItemType[]) => {
    if (items.length === 0) return;

    setLoading(true);
    try {
      const firstItem = items[0];
      if (!firstItem) return;
      await axios.post(route("admin.files.extract", { id: firstItem.id }), {});
      toast.success("Giải nén thành công");
      loadData();
    } catch (error: unknown) {
      handleAxiosError(error, "Lỗi khi giải nén");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItems = async (items: FileItemType[]) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${items.length} mục đã chọn?`)) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(route("admin.files.destroy"), {
        data: {
          ids: items.map((item) => item.id),
        },
      });
      toast.success("Xóa thành công");
      setSelectedIds(new Set());
      loadData();
    } catch (error: unknown) {
      handleAxiosError(error, "Lỗi khi xóa");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (item: FileItemType) => {
    handleDeleteItems([item]);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        setSelectedIds(new Set(filteredItems.map((item) => item.id)));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [filteredItems]);

  const handleSelect = (item: FileItemType, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(item.id);
      } else {
        next.delete(item.id);
      }
      return next;
    });
  };

  const handleSelectRange = (items: FileItemType[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      items.forEach((item) => next.add(item.id));
      return next;
    });
  };

  const getSelectedItems = (): FileItemType[] =>
    items.filter((item) => selectedIds.has(item.id));

  const handleDuplicate = (item: FileItemType) => {
    setItemToDuplicate(item);
    setDuplicateDialogOpen(true);
  };

  const handleDuplicateConfirm = async (name: string, targetFolderId: string | null) => {
    if (!itemToDuplicate) return;

    setLoading(true);
    try {
      await axios.post(route("admin.files.duplicate", { id: itemToDuplicate.id }), {
        name,
        parent_id: targetFolderId ? parseInt(targetFolderId) : null,
      });
      toast.success("Nhân bản thành công");
      loadData();
      setDuplicateDialogOpen(false);
      setItemToDuplicate(null);
    } catch (error: unknown) {
      handleAxiosError(error, "Lỗi khi nhân bản");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = () => {
    setUploadDialogOpen(true);
  };

  const handleCreateFolder = () => {
    setCreateFolderDialogOpen(true);
  };

  const handleCreateFolderConfirm = async () => {
    if (!newFolderName.trim()) return;

    setLoading(true);
    try {
      await axios.post(route("admin.files.createFolder"), {
        name: newFolderName.trim(),
        parent_id: currentFolderId ? parseInt(currentFolderId) : null,
      });
      toast.success("Tạo thư mục thành công");
      loadData();
      setCreateFolderDialogOpen(false);
      setNewFolderName("");
    } catch (error: unknown) {
      handleAxiosError(error, "Lỗi khi tạo thư mục");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-4">
        <FileHeader
          onBack={handleBack}
          onUpload={handleUpload}
          onCreateFolder={handleCreateFolder}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <FileToolbar
          sortBy={sortBy}
          sortOrder={sortOrder}
          viewMode={viewMode}
          onSortChange={handleSort}
          onViewModeChange={setViewMode}
          selectedItems={getSelectedItems()}
          onCopy={handleCopy}
          onCut={handleCut}
          onDownload={handleDownloadZip}
          onCompress={handleCompress}
          onExtract={handleExtract}
          onMove={handleMoveItems}
          onDelete={handleDeleteItems}
          onClearSelection={handleClearSelection}
        />

        <FileContextMenuRightClick
          items={getSelectedItems()}
          onCopy={handleCopy}
          onCut={handleCut}
          onDownload={handleDownloadZip}
          onCompress={handleCompress}
          onExtract={handleExtract}
          onMove={handleMoveItems}
          onRename={handleRename}
          onDelete={handleDeleteItems}
          onCreateFolder={handleCreateFolder}
          onUpload={handleUpload}
        >
          {filteredItems.length === 0 ? (
            <Empty className="border-none mt-[10%] flex flex-col items-center justify-center">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="mr-3">
                  <Cloud />
                </EmptyMedia>
                <EmptyTitle>Không có tệp tin nào</EmptyTitle>
                <EmptyDescription>
                  Tải lên tệp tin để truy cập chúng ở bất kỳ đâu.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" size="sm" onClick={handleUpload}>
                  Upload Files
                </Button>
              </EmptyContent>
            </Empty>
          ) : viewMode === "grid" ? (
            <>
              <FileGrid
                items={filteredItems}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onSelectRange={handleSelectRange}
                onItemClick={handleItemClick}
                onItemDoubleClick={handleItemDoubleClick}
                onDownload={handleDownload}
                onRename={handleRename}
                onMoveItems={handleMoveItems}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                sortBy={sortBy === "name" ? "name" : sortBy === "size" ? "size" : sortBy === "date" ? "date" : "name"}
                sortOrder={sortOrder}
                onSort={handleTableSort}
              />
              <FileFooter items={filteredItems} />
            </>
          ) : (
            <FileList
              items={filteredItems}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onSelectRange={handleSelectRange}
              onItemClick={handleItemClick}
              onItemDoubleClick={handleItemDoubleClick}
              onDownload={handleDownload}
              onRename={handleRename}
              onMove={handleMove}
              onMoveItems={handleMoveItems}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleTableSort}
            />
          )}
        </FileContextMenuRightClick>

        <DuplicateDialog
          open={duplicateDialogOpen}
          onOpenChange={setDuplicateDialogOpen}
          item={itemToDuplicate}
          allItems={items}
          onConfirm={handleDuplicateConfirm}
        />

        <RenameDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          item={itemToRename}
          onConfirm={handleRenameConfirm}
        />

        <MoveDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          items={itemsToMove}
          allItems={items}
          onConfirm={handleMoveConfirm}
        />

        <FileUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onUploadSuccess={loadData}
          parentId={currentFolderId}
        />

        <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo thư mục</DialogTitle>
              <DialogDescription>
                Nhập tên cho thư mục mới
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="folderName">Tên thư mục</Label>
                <Input
                  id="folderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Nhập tên thư mục"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateFolderConfirm();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreateFolderConfirm} disabled={!newFolderName.trim() || loading}>
                Tạo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Index;



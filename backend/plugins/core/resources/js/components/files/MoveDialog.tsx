import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@core/components/ui/dialog";
import { Button } from "@core/components/ui/button";
import type { FileItem } from "./types";
import { FolderSelector } from "./FolderSelector";

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: FileItem[];
  allItems?: FileItem[];
  onConfirm: (items: FileItem[], targetFolderId: string | null) => void;
}

export const MoveDialog = ({
  open,
  onOpenChange,
  items,
  onConfirm,
}: MoveDialogProps) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setSelectedFolderId(null);
      }, 0);
    }
  }, [open]);

  const handleSelectFolder = useCallback((folderId: string | null) => {
    setSelectedFolderId((prev) => (prev === folderId ? null : folderId));
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(items, selectedFolderId);
    onOpenChange(false);
  }, [items, selectedFolderId, onConfirm, onOpenChange]);

  const excludeIds = items.filter((i) => i.type === "folder").map((i) => i.id);

  if (items.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Di chuyển</DialogTitle>
          <DialogDescription>
            Chọn thư mục đích cho {items.length} mục đã chọn
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {open && (
            <FolderSelector
              selectedFolderId={selectedFolderId}
              onSelectFolder={handleSelectFolder}
              label="Thư mục đích"
              excludeIds={excludeIds}
              loadFromApi={true}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleConfirm}>
            Di chuyển
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


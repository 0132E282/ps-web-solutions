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
import { Input } from "@core/components/ui/input";
import { Label } from "@core/components/ui/label";
import type { FileItem } from "./types";
import { FolderSelector } from "./FolderSelector";

interface DuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileItem | null;
  allItems?: FileItem[];
  onConfirm: (name: string, targetFolderId: string | null) => void;
}

const generateUniqueName = (baseName: string, existingNames: string[]): string => {
  // Tách tên file và phần mở rộng
  const lastDotIndex = baseName.lastIndexOf('.');
  const hasExtension = lastDotIndex > 0 && lastDotIndex < baseName.length - 1;
  
  let nameWithoutExt: string;
  let extension: string;
  
  if (hasExtension) {
    nameWithoutExt = baseName.substring(0, lastDotIndex);
    extension = baseName.substring(lastDotIndex);
  } else {
    nameWithoutExt = baseName;
    extension = '';
  }
  
  // Tạo tên mới với " copy" trước phần mở rộng
  let newName = `${nameWithoutExt} copy${extension}`;
  let counter = 1;
  const lowerNames = new Set(existingNames.map(n => n.toLowerCase()));
  
  while (lowerNames.has(newName.toLowerCase())) {
    counter++;
    newName = `${nameWithoutExt} copy ${counter}${extension}`;
  }
  
  return newName;
};

export const DuplicateDialog = ({
  open,
  onOpenChange,
  item,
  allItems,
  onConfirm,
}: DuplicateDialogProps) => {
  const [name, setName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (item && open) {
      const existingNames = allItems
        ? allItems.filter((i) => i.id !== item.id).map((i) => i.name)
        : [];

      setName(generateUniqueName(item.name, existingNames));
      setSelectedFolderId(null);
    }
  }, [item, open, allItems]);

  const handleSelectFolder = useCallback((folderId: string | null) => {
    setSelectedFolderId((prev) => (prev === folderId ? null : folderId));
  }, []);

  const handleConfirm = useCallback(() => {
    const trimmedName = name.trim();
    if (trimmedName) {
      onConfirm(trimmedName, selectedFolderId);
      onOpenChange(false);
    }
  }, [name, selectedFolderId, onConfirm, onOpenChange]);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nhân bản</DialogTitle>
          <DialogDescription>
            Đặt tên mới và chọn thư mục đích cho bản sao của "{item.name}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên mới"
            />
          </div>
          {open && (
            <FolderSelector
              selectedFolderId={selectedFolderId}
              onSelectFolder={handleSelectFolder}
              excludeIds={item?.type === "folder" ? [item.id] : []}
              loadFromApi={true}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={!name.trim()}>
            Nhân bản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


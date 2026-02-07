import { useState, useEffect } from "react";
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

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileItem | null;
  onConfirm: (name: string) => void;
}

export const RenameDialog = ({
  open,
  onOpenChange,
  item,
  onConfirm,
}: RenameDialogProps) => {
  const [name, setName] = useState("");

  // Reset name when dialog opens with a new item
  useEffect(() => {
    if (!item || !open) {
      return;
    }
    
    // Extract name without extension for files
    if (item.type === "file") {
      const lastDotIndex = item.name.lastIndexOf(".");
      if (lastDotIndex > 0) {
        const nameWithoutExt = item.name.substring(0, lastDotIndex);
        setName(nameWithoutExt);
      } else {
        setName(item.name);
      }
    } else {
      setName(item.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, open]);

  const handleConfirm = () => {
    if (name.trim() && item) {
      // For files, preserve extension
      if (item.type === "file") {
        const lastDotIndex = item.name.lastIndexOf(".");
        if (lastDotIndex > 0) {
          const extension = item.name.substring(lastDotIndex);
          onConfirm(name.trim() + extension);
        } else {
          onConfirm(name.trim());
        }
      } else {
        onConfirm(name.trim());
      }
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Đổi tên</DialogTitle>
          <DialogDescription>
            Nhập tên mới cho {item.type === "folder" ? "thư mục" : "tệp"} "{item.name}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên {item.type === "file" && "(không bao gồm phần mở rộng)"}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tên mới"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={!name.trim()}>
            Đổi tên
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


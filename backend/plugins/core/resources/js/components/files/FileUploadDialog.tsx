import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@core/components/ui/dialog";
import { Button } from "@core/components/ui/button";
import { Upload, X } from "lucide-react";
import { axios } from "@core/lib/axios";
import { route } from "@core/lib/route";
import { toast } from "sonner";

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
  parentId?: string | null;
}

export const FileUploadDialog = ({
  open,
  onOpenChange,
  onUploadSuccess,
  parentId,
}: FileUploadDialogProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const fileArray = Array.from(selectedFiles);
      setFiles((prev) => [...prev, ...fileArray]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Vui lòng chọn ít nhất một file");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files[]", file);
      });
      if (parentId) {
        formData.append("parent_id", parentId);
      }

      await axios.post(route("admin.files.store"), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Tải file thành công");
      setFiles([]);
      onOpenChange(false);
      onUploadSuccess?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Lỗi khi tải file");
    } finally {
      setUploading(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && !uploading) {
      setFiles([]);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tải file lên</DialogTitle>
          <DialogDescription>
            Chọn một hoặc nhiều file để tải lên
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload-input"
            />
            <label
              htmlFor="file-upload-input"
              className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
            >
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Click để chọn file hoặc kéo thả file vào đây
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Có thể chọn nhiều file
                </p>
              </div>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700">
                Đã chọn {files.length} file:
              </p>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="ml-2"
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleDialogClose(false)}
            disabled={uploading}
          >
            Hủy
          </Button>
          <Button onClick={handleUpload} disabled={files.length === 0 || uploading}>
            {uploading ? "Đang tải..." : "Tải lên"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};





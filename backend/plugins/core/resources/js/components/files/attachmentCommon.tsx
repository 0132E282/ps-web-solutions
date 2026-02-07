/**
 * Common utilities and small components for file attachment
 */

import React from "react"
import { Button } from "@core/components/ui/button"
import { Input } from "@core/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@core/components/ui/dialog"
import { Upload } from "lucide-react"

// Types
type FileLike = File | { absolute_url?: string; path?: string; name?: string } | string | null

// File Helpers
export const getFileName = (file: FileLike): string => {
  if (!file) return ""
  if (file instanceof File) return file.name
  if (typeof file === 'string') return file.split('/').pop() || ""
  return file.name || ""
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getPreviewUrl = (file: FileLike, _objectUrlRef?: React.MutableRefObject<string | null>): string | null => {
  if (!file || file instanceof File) return null
  if (typeof file === 'string') return file
  return file.absolute_url || file.path || null
}

export const handleFileView = (file: FileLike, getPreviewUrlFn: (file: FileLike) => string | null) => {
  if (!file) return
  
  const previewUrl = getPreviewUrlFn(file)
  if (previewUrl) {
    window.open(previewUrl, '_blank')
  } else if (file instanceof File) {
    const url = URL.createObjectURL(file)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }
}

export const handleFileDownload = (file: FileLike, getFileNameFn: (file: FileLike) => string) => {
  if (!file) return
  
  const a = document.createElement('a')
  if (file instanceof File) {
    const url = URL.createObjectURL(file)
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } else {
    a.href = typeof file === 'string' ? file : file.absolute_url || file.path || '#'
    a.download = getFileNameFn(file)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}

// Size classes
export const sizeClasses = {
  sm: "w-[100px] h-[100px]",
  md: "w-[150px] h-[150px]",
  lg: "w-[180px] h-[180px]",
}

// RenameDialog Component
interface RenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileName: string
  onSave: (newName: string) => void
}

export const AttachmentRenameDialog: React.FC<RenameDialogProps> = ({
  open,
  onOpenChange,
  fileName,
  onSave,
}) => {
  const [newFileName, setNewFileName] = React.useState(fileName)

  React.useEffect(() => {
    if (open) {
      setNewFileName(fileName)
    }
  }, [open, fileName])

  const handleSave = () => {
    if (newFileName.trim()) {
      onSave(newFileName.trim())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Đổi tên file</DialogTitle>
          <DialogDescription>
            Nhập tên mới cho file
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="Tên file"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave()
              }
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={!newFileName.trim()}
          >
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// UploadArea Component
interface UploadAreaProps {
  id: string
  disabled?: boolean
  readOnly?: boolean
  text?: string
  size?: "sm" | "md" | "lg"
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  id,
  disabled = false,
  readOnly = false,
  text = "Click to upload file",
  size = "md",
}) => {
  return (
    <label
      htmlFor={id}
      className={`block ${sizeClasses[size]} border rounded-lg transition-colors flex-shrink-0 ${
        disabled || readOnly
          ? 'border-gray-200 cursor-not-allowed bg-gray-50'
          : 'border-gray-300 cursor-pointer hover:border-gray-400 bg-white'
      }`}
    >
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Upload className="h-5 w-5 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">{text}</p>
      </div>
    </label>
  )
}

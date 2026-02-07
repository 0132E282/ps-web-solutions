import React from "react"
import { Button } from "@core/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@core/components/ui/dropdown-menu"
import { MoreVertical, Edit, Eye, Download, X } from "lucide-react"
import { getFileName, getPreviewUrl, handleFileView, handleFileDownload } from "./attachmentCommon"

interface AttachmentActionsMenuProps {
  file: File | string | null
  objectUrlRef?: React.MutableRefObject<string | null>
  readOnly?: boolean
  onRename?: () => void
  onRemove?: () => void
  onView?: () => void
  onDownload?: () => void
}

export const AttachmentActionsMenu: React.FC<AttachmentActionsMenuProps> = ({
  file,
  objectUrlRef,
  readOnly = false,
  onRename,
  onRemove,
  onView,
  onDownload,
}) => {
  const handleViewClick = () => {
    if (onView) {
      onView()
    } else {
      handleFileView(file, (f) => getPreviewUrl(f, objectUrlRef))
    }
  }

  const handleDownloadClick = () => {
    if (onDownload) {
      onDownload()
    } else {
      handleFileDownload(file, getFileName)
    }
  }

  if (readOnly) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          className="absolute top-1 right-1 z-10 h-6 w-6 p-0 bg-white/80 hover:bg-white"
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {onRename && (
          <DropdownMenuItem onClick={onRename}>
            <Edit className="h-4 w-4 mr-2" />
            Đổi tên
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleViewClick}>
          <Eye className="h-4 w-4 mr-2" />
          Xem
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadClick}>
          <Download className="h-4 w-4 mr-2" />
          Tải xuống
        </DropdownMenuItem>
        {onRemove && (
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove()
            }}
            className="text-destructive focus:text-destructive"
          >
            <X className="h-4 w-4 mr-2" />
            Xóa
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}




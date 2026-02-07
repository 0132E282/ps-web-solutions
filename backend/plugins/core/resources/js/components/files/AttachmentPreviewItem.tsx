import React from "react"
import { AttachmentPreview } from "./AttachmentPreview"
import { getPreviewUrl } from "./attachmentCommon"

interface AttachmentPreviewItemProps {
  file: File | string | null
  index: number
  objectUrlsRef: React.MutableRefObject<Map<number, string>>
  size?: "sm" | "md" | "lg"
  showOverlay?: boolean
  showActions?: boolean
  readOnly?: boolean
  disabled?: boolean
  onRemove?: () => void
  children?: React.ReactNode
  className?: string
}

export const AttachmentPreviewItem: React.FC<AttachmentPreviewItemProps> = ({
  file,
  index,
  objectUrlsRef,
  size = "md",
  showOverlay = true,
  showActions = false,
  readOnly = false,
  disabled = false,
  onRemove,
  children,
  className = "",
}) => {
  const fileObjectUrlRef = React.useRef<string | null>(null)
  
  React.useEffect(() => {
    if (file instanceof File && file.type.startsWith('image/')) {
      if (!objectUrlsRef.current.has(index)) {
        const url = URL.createObjectURL(file)
        objectUrlsRef.current.set(index, url)
        fileObjectUrlRef.current = url
      } else {
        fileObjectUrlRef.current = objectUrlsRef.current.get(index) || null
      }
    } else if (typeof file === 'string') {
      fileObjectUrlRef.current = file
    }
  }, [file, index, objectUrlsRef])

  return (
    <AttachmentPreview
      file={file}
      objectUrlRef={fileObjectUrlRef}
      size={size}
      showOverlay={showOverlay}
      showActions={showActions}
      readOnly={readOnly}
      disabled={disabled}
      className={className}
    >
      {children}
    </AttachmentPreview>
  )
}


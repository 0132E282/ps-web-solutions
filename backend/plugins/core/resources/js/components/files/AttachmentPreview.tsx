import React from "react"
import { Image as ImageIcon } from "lucide-react"
import { getFileName, getPreviewUrl, sizeClasses } from "./attachmentCommon"

interface AttachmentPreviewProps {
  file: File | string | null
  objectUrlRef?: React.MutableRefObject<string | null>
  size?: "sm" | "md" | "lg"
  showOverlay?: boolean
  showActions?: boolean
  readOnly?: boolean
  disabled?: boolean
  children?: React.ReactNode
  className?: string
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  file,
  objectUrlRef,
  size = "md",
  showOverlay = true,
  showActions = false,
  readOnly = false,
  disabled = false,
  children,
  className = "",
}) => {
  // Internal ref để quản lý object URL nếu parent không cung cấp
  const internalObjectUrlRef = React.useRef<string | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(() => {
    if (file instanceof File && file.type.startsWith('image/')) {
      // Nếu có objectUrlRef từ parent, sử dụng nó
      if (objectUrlRef?.current) {
        return objectUrlRef.current
      }
      // Nếu không, tạo mới
      const url = URL.createObjectURL(file)
      internalObjectUrlRef.current = url
      return url
    }
    return getPreviewUrl(file, objectUrlRef)
  })
  
  // Tạo và quản lý object URL khi file thay đổi
  React.useEffect(() => {
    // Cleanup URL cũ từ internal ref
    if (internalObjectUrlRef.current) {
      URL.revokeObjectURL(internalObjectUrlRef.current)
      internalObjectUrlRef.current = null
    }
    
    if (file instanceof File && file.type.startsWith('image/')) {
      // Nếu có objectUrlRef từ parent, sử dụng nó
      if (objectUrlRef?.current) {
        setPreviewUrl(objectUrlRef.current)
      } else {
        // Tự tạo object URL
        const url = URL.createObjectURL(file)
        internalObjectUrlRef.current = url
        setPreviewUrl(url)
      }
    } else {
      // Không phải File hoặc không phải image, dùng getPreviewUrl
      setPreviewUrl(getPreviewUrl(file, objectUrlRef))
    }
    
    return () => {
      // Cleanup internal URL khi unmount hoặc file thay đổi
      if (internalObjectUrlRef.current) {
        URL.revokeObjectURL(internalObjectUrlRef.current)
        internalObjectUrlRef.current = null
      }
    }
    // objectUrlRef được quản lý bởi parent, không cần trong deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])
  
  const fileName = getFileName(file)

  return (
    <div className={`relative ${sizeClasses[size]} border-2  overflow-hidden rounded-lg transition-colors flex-shrink-0 ${
      disabled || readOnly
        ? 'border-gray-200 cursor-not-allowed bg-gray-50'
        : 'border-gray-300 cursor-pointer hover:border-gray-400 bg-white'
    } ${className}`}>
      <div className="w-full h-full relative">
        {previewUrl ? (
          <div className="w-full h-full rounded overflow-hidden">
            <img
              src={previewUrl}
              alt={fileName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-full rounded flex items-center justify-center bg-gray-100">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>

      {showOverlay && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 rounded-b-lg">
          <p className="text-xs font-medium truncate" title={fileName}>
            {fileName || "No file selected"}
          </p>
          {file instanceof File && file.size && (
            <p className="text-xs text-gray-300">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
      )}

      {showActions && children}
    </div>
  )
}

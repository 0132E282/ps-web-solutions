import React from "react"
import { Control, FieldValues, useWatch, ControllerRenderProps } from "react-hook-form"
import { FormField } from "@core/components/ui/form"
import { Input } from "@core/components/ui/input"
import { Button } from "@core/components/ui/button"
import { GripVertical, FolderOpen, Upload, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@core/components/ui/dropdown-menu"
import {
  UploadArea,
  FilePreview,
  FilePreviewItem,
  FileActionsMenu,
  AttachmentRenameDialog as RenameDialog,
  FileManagerDialog,
  getFileName,
  sizeClasses,
} from "@core/components/files"
import type { FileItem } from "@core/components/files/types"

export interface CustomFormFieldProps {
  control: Control<FieldValues, string>
  name: string
  label?: string
  placeholder?: string
  description?: string
  accept?: string
  disabled?: boolean
  required?: boolean
  readOnly?: boolean
  className?: string
  multiple?: boolean
  allowFileManager?: boolean
}

const InputAttachment: React.FC<CustomFormFieldProps> = ({
  control,
  name,
  accept,
  disabled,
  readOnly,
  multiple = false,
  allowFileManager = true,
  ...props
}) => {
  // Single file state
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false)
  
  // Multiple files state
  const objectUrlsRef = React.useRef<Map<number, string>>(new Map())
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)
  const [renameDialogState, setRenameDialogState] = React.useState<{
    open: boolean
    index: number | null
  }>({ open: false, index: null })
  
  // File Manager state
  const [fileManagerOpen, setFileManagerOpen] = React.useState(false)
  
  // Watch value để sync preview
  const value = useWatch({ control, name })

  // Tạo object URLs cho multiple files khi files được chọn
  React.useEffect(() => {
    if (multiple) {
      const files = Array.isArray(value) ? value : value ? [value] : []
      
      // Cleanup URLs cũ không còn trong danh sách
      const currentIndices = new Set(Array.from({ length: files.length }, (_, i) => i))
      objectUrlsRef.current.forEach((url, index) => {
        if (!currentIndices.has(index)) {
          URL.revokeObjectURL(url)
          objectUrlsRef.current.delete(index)
        }
      })
      
      // Tạo URLs mới cho files mới
      files.forEach((file, index) => {
        if (file instanceof File && file.type.startsWith('image/')) {
          if (!objectUrlsRef.current.has(index)) {
            const url = URL.createObjectURL(file)
            objectUrlsRef.current.set(index, url)
          }
        }
      })
      
      return () => {
        objectUrlsRef.current.forEach((url) => {
          URL.revokeObjectURL(url)
        })
        objectUrlsRef.current.clear()
      }
    }
    return undefined
  }, [value, multiple])

  // Cleanup object URLs khi component unmount (chỉ cho multiple files)
  React.useEffect(() => {
    if (multiple) {
      const urls = objectUrlsRef.current
      return () => {
        urls.forEach((url) => {
          URL.revokeObjectURL(url)
        })
        urls.clear()
      }
    }
    return undefined
  }, [multiple])

  // Single file handlers
  const handleFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>, onChange: (file: File | null) => void) => {
    const selectedFile = event.target.files?.[0] || null
    if (selectedFile) {
      onChange(selectedFile)
    }
  }, [])

  const removeFile = React.useCallback((onChange: (file: File | null) => void) => {
    onChange(null)
  }, [])

  const handleRename = React.useCallback((onChange: (file: File | null) => void, newFileName: string) => {
    if (!value || !newFileName.trim()) return
    
    if (value instanceof File) {
      const renamedFile = new File([value], newFileName, { type: value.type })
      onChange(renamedFile)
    }
  }, [value])

  // Multiple files handlers
  const handleMultipleFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>, onChange: (files: File[]) => void) => {
    const selectedFiles = event.target.files
    if (selectedFiles) {
      const fileArray = Array.from(selectedFiles)
      const files = Array.isArray(value) ? value : value ? [value] : []
      const newFiles = [...files, ...fileArray]
      onChange(newFiles)
    }
    // Reset input để có thể chọn lại cùng file
    event.target.value = ''
  }, [value])

  const removeMultipleFile = React.useCallback((index: number, onChange: (files: File[]) => void) => {
    const files = Array.isArray(value) ? value : value ? [value] : []
    const file = files[index]
    // Cleanup object URL nếu là image
    if (file instanceof File && file.type.startsWith('image/')) {
      const url = objectUrlsRef.current.get(index)
      if (url) {
        URL.revokeObjectURL(url)
        objectUrlsRef.current.delete(index)
      }
    }
    const newFiles = files.filter((_, i) => i !== index)
    // Rebuild objectUrlsRef map sau khi remove
    const newUrls = new Map<number, string>()
    newFiles.forEach((f, i) => {
      if (f instanceof File && f.type.startsWith('image/')) {
        const oldIndex = files.findIndex((_, idx) => idx !== index && files[idx] === f)
        if (oldIndex >= 0 && objectUrlsRef.current.has(oldIndex)) {
          newUrls.set(i, objectUrlsRef.current.get(oldIndex)!)
        } else {
          const url = URL.createObjectURL(f)
          newUrls.set(i, url)
        }
      }
    })
    objectUrlsRef.current = newUrls
    onChange(newFiles)
  }, [value])

  const handleDragStart = React.useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragOver = React.useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }, [])

  const handleDragLeave = React.useCallback(() => {
    setDragOverIndex(null)
  }, [])

  const handleDrop = React.useCallback((e: React.DragEvent, dropIndex: number, onChange: (files: File[]) => void) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const files = Array.isArray(value) ? value : value ? [value] : []
    // Reorder files
    const newFiles = [...files]
    const [draggedFile] = newFiles.splice(draggedIndex, 1)
    newFiles.splice(dropIndex, 0, draggedFile)

    // Rebuild objectUrlsRef map
    const newUrls = new Map<number, string>()
    newFiles.forEach((file, i) => {
      if (file instanceof File && file.type.startsWith('image/')) {
        // Try to find existing URL from old position
        const oldIndex = files.findIndex((f) => f === file)
        if (oldIndex >= 0 && objectUrlsRef.current.has(oldIndex)) {
          newUrls.set(i, objectUrlsRef.current.get(oldIndex)!)
        } else {
          const url = URL.createObjectURL(file)
          newUrls.set(i, url)
        }
      }
    })
    objectUrlsRef.current = newUrls
    onChange(newFiles)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [value, draggedIndex])

  const handleDragEnd = React.useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  const handleMultipleRename = React.useCallback((index: number, newFileName: string, onChange: (files: File[]) => void) => {
    if (!newFileName.trim()) return
    
    const files = Array.isArray(value) ? value : value ? [value] : []
    const file = files[index]
    if (file instanceof File) {
      const renamedFile = new File([file], newFileName, { type: file.type })
      const newFiles = [...files]
      newFiles[index] = renamedFile
      onChange(newFiles)
    }
  }, [value])

  const handleView = React.useCallback((index: number) => {
    const files = Array.isArray(value) ? value : value ? [value] : []
    const file = files[index]
    if (!file) return
    
    const url = objectUrlsRef.current.get(index)
    if (url) {
      window.open(url, '_blank')
    } else if (file instanceof File) {
      const tempUrl = URL.createObjectURL(file)
      window.open(tempUrl, '_blank')
      setTimeout(() => URL.revokeObjectURL(tempUrl), 100)
    } else if (typeof file === 'string') {
      window.open(file, '_blank')
    }
  }, [value])

  const handleDownload = React.useCallback((index: number) => {
    const files = Array.isArray(value) ? value : value ? [value] : []
    const file = files[index]
    if (!file) return
    
    if (file instanceof File) {
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else if (typeof file === 'string') {
      const a = document.createElement('a')
      a.href = file
      a.download = getFileName(file)
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }, [value])

  // File Manager handlers
  const handleFileManagerSelect = React.useCallback((items: FileItem[], onChange: (files: File[] | string[] | File | string | null) => void) => {
    if (items.length === 0) return
    
    // Convert FileItem to URL strings
    const fileUrls = items
      .filter(item => item.type === 'file')
      .map(item => item.absolute_url || item.path || '')
      .filter(url => url !== '')
    
    if (fileUrls.length === 0) return
    
    if (multiple) {
      const currentFiles = Array.isArray(value) ? value : value ? [value] : []
      // Filter out strings that are already in the list
      const newUrls = fileUrls.filter(url => !currentFiles.includes(url))
      onChange([...currentFiles, ...newUrls])
    } else {
      // Single file mode - use first selected file
      const firstUrl = fileUrls[0]
      if (firstUrl) {
        onChange(firstUrl)
      }
    }
  }, [value, multiple])

  const renderField = React.useCallback(({ field: { onChange, name: fieldName, ref } }: { field: ControllerRenderProps<FieldValues, string> }) => {
    if (multiple) {
      const files = Array.isArray(value) ? value : value ? [value] : []
      
      return (
        <div className="space-y-3">
          {/* File Input */}
          <Input
            type="file"
            accept={accept}
            multiple
            onChange={(e) => handleMultipleFileChange(e, onChange as (files: File[]) => void)}
            className="hidden"
            id={`multiple-attachment-${name}`}
            name={fieldName}
            ref={ref}
            disabled={disabled || readOnly}
            {...props}
          />

          {/* Upload Area and Files on same row */}
          <div className="flex flex-wrap gap-3 items-start">
            {/* Upload Area */}
            <div className="flex flex-col gap-2">
              {allowFileManager && !readOnly && !disabled ? (
                <div className="relative">
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      setFileManagerOpen(true)
                    }}
                    className={`${sizeClasses["md"]} border rounded-lg transition-colors shrink-0 cursor-pointer hover:border-gray-400 bg-white flex flex-col items-center justify-center p-4 text-center`}
                  >
                    <FolderOpen className="h-5 w-5 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Chọn từ File Manager</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-white/80 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          document.getElementById(`multiple-attachment-${name}`)?.click()
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload từ hệ thống
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          setFileManagerOpen(true)
                        }}
                      >
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Upload từ File Manager
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <UploadArea
                  id={`multiple-attachment-${name}`}
                  disabled={disabled}
                  readOnly={readOnly}
                  text="Click to upload files"
                  size="md"
                />
              )}
            </div>

            {/* Display selected files */}
            {files.length > 0 && (
              <>
                {files.map((file, index) => {
                  const isDragging = draggedIndex === index
                  const isDragOver = dragOverIndex === index
                  
                  return (
                    <div
                      key={index}
                      draggable={!readOnly && !disabled}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index, onChange as (files: File[]) => void)}
                      onDragEnd={handleDragEnd}
                      className={`relative transition-all ${
                        isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab'
                      } ${
                        isDragOver ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      } ${readOnly || disabled ? 'cursor-default' : ''}`}
                    >
                      {/* Drag Handle */}
                      {!readOnly && !disabled && (
                        <div className="absolute top-1 left-1 z-10 p-1 bg-white/80 rounded hover:bg-white">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                        </div>
                      )}

                      <FilePreviewItem
                        file={file}
                        index={index}
                        objectUrlsRef={objectUrlsRef}
                        size="md"
                        showOverlay={true}
                        showActions={!readOnly}
                        readOnly={readOnly}
                        disabled={disabled}
                        onRemove={() => removeMultipleFile(index, onChange as (files: File[]) => void)}
                      >
                        {!readOnly && (
                          <FileActionsMenu
                            file={file}
                            objectUrlRef={{ current: objectUrlsRef.current.get(index) || null } as React.MutableRefObject<string | null>}
                            readOnly={readOnly}
                            onRename={() => setRenameDialogState({ open: true, index })}
                            onRemove={() => removeMultipleFile(index, onChange as (files: File[]) => void)}
                            onView={() => handleView(index)}
                            onDownload={() => handleDownload(index)}
                          />
                        )}
                      </FilePreviewItem>
                    </div>
                  )
                })}
              </>
            )}
          </div>

          {/* Rename Dialog */}
          {renameDialogState.index !== null && (
            <RenameDialog
              open={renameDialogState.open}
              onOpenChange={(open) => setRenameDialogState({ open, index: open ? renameDialogState.index : null })}
              fileName={getFileName(files[renameDialogState.index])}
              onSave={(newName) => {
                if (renameDialogState.index !== null) {
                  handleMultipleRename(renameDialogState.index, newName, onChange as (files: File[]) => void)
                }
              }}
            />
          )}

          {/* File Manager Dialog */}
          {allowFileManager && (
            <FileManagerDialog
              open={fileManagerOpen}
              onOpenChange={setFileManagerOpen}
              multiple={multiple}
              acceptTypes={["file"]}
              allowedFileTypes={accept ? [accept] : undefined}
              onSelect={(items) => handleFileManagerSelect(items, onChange)}
            />
          )}
        </div>
      )
    }

    // Single file mode
    return (
      <div className="flex flex-wrap gap-3 items-start">
        {/* File Input */}
        <Input
          type="file"
          accept={accept}
          onChange={(e) => handleFileChange(e, onChange as (file: File | null) => void)}
          className="hidden"
          id={`attachment-${name}`}
          name={fieldName}
          ref={ref}
          disabled={disabled || readOnly}
          {...props}
        />

        {/* Upload Area */}
        {!value && (
          <div className="flex flex-col gap-2">
            {allowFileManager && !readOnly && !disabled ? (
              <div className="relative">
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setFileManagerOpen(true)
                  }}
                  className={`${sizeClasses["md"]} border rounded-lg transition-colors shrink-0 cursor-pointer hover:border-gray-400 bg-white flex flex-col items-center justify-center p-4 text-center`}
                >
                  <FolderOpen className="h-5 w-5 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Chọn từ File Manager</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-white/80 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        document.getElementById(`attachment-${name}`)?.click()
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload từ hệ thống
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        setFileManagerOpen(true)
                      }}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Upload từ File Manager
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <UploadArea
                id={`attachment-${name}`}
                disabled={disabled}
                readOnly={readOnly}
                text="Click to upload file"
                size="md"
              />
            )}
          </div>
        )}

        {/* Preview */}
        {value && (
          <div className="flex flex-col gap-2">
            <label htmlFor={`attachment-${name}`}>
              <FilePreview
                file={value}
                size="md"
                showOverlay={true}
                showActions={!readOnly}
                readOnly={readOnly}
                disabled={disabled}
              >
                <FileActionsMenu
                  file={value}
                  readOnly={readOnly}
                  onRename={() => setIsRenameDialogOpen(true)}
                  onRemove={() => removeFile(onChange as (file: File | null) => void)}
                />
              </FilePreview>
            </label>
            {allowFileManager && !readOnly && !disabled && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                    }}
                  >
                    <MoreVertical className="h-4 w-4 mr-2" />
                    Tùy chọn
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      document.getElementById(`attachment-${name}`)?.click()
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload từ hệ thống
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      setFileManagerOpen(true)
                    }}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Upload từ File Manager
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {/* Rename Dialog */}
        <RenameDialog
          open={isRenameDialogOpen}
          onOpenChange={setIsRenameDialogOpen}
          fileName={getFileName(value)}
          onSave={(newName) => handleRename(onChange as (file: File | null) => void, newName)}
        />

        {/* File Manager Dialog */}
        {allowFileManager && (
          <FileManagerDialog
            open={fileManagerOpen}
            onOpenChange={setFileManagerOpen}
            multiple={false}
            acceptTypes={["file"]}
            allowedFileTypes={accept ? [accept] : undefined}
            onSelect={(items) => handleFileManagerSelect(items, onChange)}
          />
        )}
      </div>
    )
  }, [name, accept, disabled, readOnly, multiple, allowFileManager, value, isRenameDialogOpen, draggedIndex, dragOverIndex, renameDialogState, fileManagerOpen, handleFileChange, removeFile, handleRename, handleMultipleFileChange, removeMultipleFile, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd, handleMultipleRename, handleView, handleDownload, handleFileManagerSelect, props])

  return (
    <FormField
      control={control}
      name={name}
      render={renderField}
    />
  )
}

export default InputAttachment

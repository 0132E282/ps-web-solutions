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
  FilePreviewItem, // Note: inputAttachment used FilePreview for single, FilePreviewItem for multiple.
  FileActionsMenu,
  AttachmentRenameDialog as RenameDialog,
  FileManagerDialog,
  getFileName,
  sizeClasses,
} from "@core/components/files"
import type { FileItem } from "@core/components/files/types"

export interface InputMultipleAttachmentsProps {
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
  allowFileManager?: boolean
}

const InputMultipleAttachments: React.FC<InputMultipleAttachmentsProps> = ({
  control,
  name,
  accept,
  disabled,
  readOnly,
  allowFileManager = true,
  ...props
}) => {
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

  // Watch value to sync preview
  const value = useWatch({ control, name })

  // Ensure value is always an array
  const filesArray = React.useMemo(() => {
    return Array.isArray(value) ? value : value ? [value] : []
  }, [value])

  // Create object URLs for multiple files when files are selected
  React.useEffect(() => {
    // Cleanup old URLs not in the list
    const currentIndices = new Set(Array.from({ length: filesArray.length }, (_, i) => i))
    objectUrlsRef.current.forEach((url, index) => {
      if (!currentIndices.has(index)) {
        URL.revokeObjectURL(url)
        objectUrlsRef.current.delete(index)
      }
    })

    // Create new URLs for new files
    filesArray.forEach((file: any, index: number) => {
      if (file instanceof File && file.type.startsWith('image/')) {
        if (!objectUrlsRef.current.has(index)) {
          const url = URL.createObjectURL(file)
          objectUrlsRef.current.set(index, url)
        }
      }
    })

    return () => {
      // We don't clear everything here because this runs on every render/value change
      // where we want to keep valid URLs.
      // The full cleanup is in the unmount effect.
    }
  }, [filesArray])

  // Cleanup object URLs when component unmounts
  React.useEffect(() => {
    const urls = objectUrlsRef.current
    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url)
      })
      urls.clear()
    }
  }, [])

  // Multiple files handlers
  const handleMultipleFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>, onChange: (files: File[]) => void) => {
    const selectedFiles = event.target.files
    if (selectedFiles) {
      const fileArray = Array.from(selectedFiles)
      const newFiles = [...filesArray, ...fileArray]
      onChange(newFiles)
    }
    // Reset input to allow selecting the same file again
    event.target.value = ''
  }, [filesArray])

  const removeMultipleFile = React.useCallback((index: number, onChange: (files: File[]) => void) => {
    const file = filesArray[index]
    // Cleanup object URL if it's an image
    if (file instanceof File && file.type.startsWith('image/')) {
      const url = objectUrlsRef.current.get(index)
      if (url) {
        URL.revokeObjectURL(url)
        objectUrlsRef.current.delete(index)
      }
    }
    const newFiles = filesArray.filter((_: any, i: number) => i !== index)

    // Rebuild objectUrlsRef map after removal to maintain correct indices
    const newUrls = new Map<number, string>()
    newFiles.forEach((f: any, i: number) => {
      if (f instanceof File && f.type.startsWith('image/')) {
        const oldIndex = filesArray.findIndex((_: any, idx: number) => idx !== index && filesArray[idx] === f)
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
  }, [filesArray])

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

    // Reorder files
    const newFiles = [...filesArray]
    const [draggedFile] = newFiles.splice(draggedIndex, 1)
    newFiles.splice(dropIndex, 0, draggedFile)

    // Rebuild objectUrlsRef map
    const newUrls = new Map<number, string>()
    newFiles.forEach((file: any, i: number) => {
      if (file instanceof File && file.type.startsWith('image/')) {
        // Try to find existing URL from old position
        const oldIndex = filesArray.findIndex((f: any) => f === file)
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
  }, [filesArray, draggedIndex])

  const handleDragEnd = React.useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  const handleMultipleRename = React.useCallback((index: number, newFileName: string, onChange: (files: File[]) => void) => {
    if (!newFileName.trim()) return

    const file = filesArray[index]
    if (file instanceof File) {
      const renamedFile = new File([file], newFileName, { type: file.type })
      const newFiles = [...filesArray]
      newFiles[index] = renamedFile
      onChange(newFiles)
    }
  }, [filesArray])

  const handleView = React.useCallback((index: number) => {
    const file = filesArray[index]
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
  }, [filesArray])

  const handleDownload = React.useCallback((index: number) => {
    const file = filesArray[index]
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
  }, [filesArray])

  // File Manager handlers
  const handleFileManagerSelect = React.useCallback((items: FileItem[], onChange: (files: File[] | string[] | File | string | null) => void) => {
    if (items.length === 0) return

    // Convert FileItem to URL strings
    const fileUrls = items
      .filter(item => item.type === 'file')
      .map(item => item.absolute_url || item.path || '')
      .filter(url => url !== '')

    if (fileUrls.length === 0) return

    const currentFiles = filesArray
    // Filter out strings that are already in the list
    const newUrls = fileUrls.filter(url => !currentFiles.includes(url))
    onChange([...currentFiles, ...newUrls])
  }, [filesArray])

  const renderField = React.useCallback(({ field: { onChange, name: fieldName, ref } }: { field: ControllerRenderProps<FieldValues, string> }) => {
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
          {filesArray.length > 0 && (
            <>
              {filesArray.map((file: any, index: number) => {
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
            fileName={getFileName(filesArray[renameDialogState.index])}
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
            multiple={true}
            acceptTypes={["file"]}
            allowedFileTypes={accept ? [accept] : undefined}
            onSelect={(items) => handleFileManagerSelect(items, onChange)}
          />
        )}
      </div>
    )
  }, [name, accept, disabled, readOnly, allowFileManager, filesArray, draggedIndex, dragOverIndex, renameDialogState, fileManagerOpen, handleMultipleFileChange, removeMultipleFile, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd, handleMultipleRename, handleView, handleDownload, handleFileManagerSelect, props])

  return (
    <FormField
      control={control}
      name={name}
      render={renderField}
    />
  )
}

export default InputMultipleAttachments

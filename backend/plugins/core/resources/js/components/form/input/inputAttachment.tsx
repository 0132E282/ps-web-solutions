import React from "react"
import { Control, FieldValues, useWatch, ControllerRenderProps } from "react-hook-form"
import { FormField } from "@core/components/ui/form"
import { Input } from "@core/components/ui/input"
import { Button } from "@core/components/ui/button"
import { FolderOpen, Upload, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@core/components/ui/dropdown-menu"
import {
  UploadArea,
  FilePreview,
  FileActionsMenu,
  AttachmentRenameDialog as RenameDialog,
  FileManagerDialog,
  getFileName,
  sizeClasses,
} from "@core/components/files"
import type { FileItem } from "@core/components/files/types"
import InputMultipleAttachments from "./inputMultipleAttachments"

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
  if (multiple) {
      return <InputMultipleAttachments
        control={control}
        name={name}
        accept={accept}
        disabled={disabled}
        readOnly={readOnly}
        allowFileManager={allowFileManager}
        {...props}
      />
  }

  // Single file state
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false)

  // File Manager state
  const [fileManagerOpen, setFileManagerOpen] = React.useState(false)

  // Watch value de sync preview
  const value = useWatch({ control, name })

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

  // File Manager handlers
  const handleFileManagerSelect = React.useCallback((items: FileItem[], onChange: (files: File[] | string[] | File | string | null) => void) => {
    if (items.length === 0) return

    // Convert FileItem to URL strings
    const fileUrls = items
      .filter(item => item.type === 'file')
      .map(item => item.absolute_url || item.path || '')
      .filter(url => url !== '')

    if (fileUrls.length === 0) return

    // Single file mode - use first selected file
    const firstUrl = fileUrls[0]
    if (firstUrl) {
    onChange(firstUrl)
    }
  }, [value])

  const renderField = React.useCallback(({ field: { onChange, name: fieldName, ref } }: { field: ControllerRenderProps<FieldValues, string> }) => {
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
  }, [name, accept, disabled, readOnly, allowFileManager, value, isRenameDialogOpen, fileManagerOpen, handleFileChange, removeFile, handleRename, handleFileManagerSelect, props])

  return (
    <FormField
      control={control}
      name={name}
      render={renderField}
    />
  )
}

export default InputAttachment

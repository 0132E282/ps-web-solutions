import React from "react"
import { ControllerRenderProps, FieldValues } from "react-hook-form"
import { cn } from "@core/lib/utils"
import CKEditor from "@core/lib/ckeditor5/CKEditor"

export interface InputEditorProps {
  field: ControllerRenderProps<FieldValues, string>
  placeholder?: string
  className?: string
  disabled?: boolean
  readOnly?: boolean
  rows?: number
}

const InputEditor: React.FC<InputEditorProps> = ({
  field,
  placeholder = "Start typing...",
  className,
  disabled,
  readOnly,
  rows = 10,
}) => {
  return (
    <div className={cn(disabled || readOnly ? "opacity-50 pointer-events-none" : "", className)}>
      <CKEditor
        data={field.value as string | undefined || ""}
        onChange={(data) => {
          if (!disabled && !readOnly) {
            field.onChange(data)
          }
        }}
        rows={rows}
        disabled={disabled || readOnly}
        placeholder={placeholder}
      />
    </div>
  )
}

export default InputEditor


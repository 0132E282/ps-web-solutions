import React from "react"
import { ControllerRenderProps, FieldValues } from "react-hook-form"
import { Checkbox } from "@core/components/ui/checkbox"
import { Label } from "@core/components/ui/label"

export interface CustomFormFieldProps {
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  label?: string
  options?: Array<{ value: string; label: string }>
}

const InputCheckbox: React.FC<CustomFormFieldProps & { field: ControllerRenderProps<FieldValues, string> }> = ({
  field,
  disabled,
  readOnly,
  required,
  label,
  options,
  ...props
}) => {
  const id = React.useId()

  // Nếu không có giá trị và có options, lấy giá trị đầu tiên
  React.useEffect(() => {
    if ((field.value === undefined || field.value === null) && options && options.length > 0) {
      const firstOption = options[0]
      if (firstOption) {
        field.onChange(firstOption.value)
      }
    }
  }, [field, options])

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        {...props}
        checked={field.value ?? false}
        onCheckedChange={field.onChange}
        disabled={disabled || readOnly}
        required={required}
      />
      <Label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </Label>
    </div>
  )
}

export default InputCheckbox

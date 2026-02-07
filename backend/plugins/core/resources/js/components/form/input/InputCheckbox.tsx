import React from "react"
import { ControllerRenderProps, FieldValues } from "react-hook-form"
import { Checkbox } from "@core/components/ui/checkbox"

export interface CustomFormFieldProps {
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  options?: Array<{ value: string; label: string }>
}

const InputCheckbox: React.FC<CustomFormFieldProps & { field: ControllerRenderProps<FieldValues, string> }> = ({
  field,
  disabled,
  readOnly,
  required,
  options,
  ...props
}) => {
  // Nếu không có giá trị và có options, lấy giá trị đầu tiên
  React.useEffect(() => {
    if ((field.value === undefined || field.value === null) && options && options.length > 0) {
      const firstOption = options[0]
      if (firstOption) {
        field.onChange(firstOption.value)
      }
    }
  }, [field, options])

  return <Checkbox
  {...props}
  checked={field.value ?? false}
  onCheckedChange={field.onChange}
  disabled={disabled || readOnly}
  required={required}
/>
}

export default InputCheckbox

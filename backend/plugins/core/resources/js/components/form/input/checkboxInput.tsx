import React from "react"
import { ControllerRenderProps, FieldValues } from "react-hook-form"
import { Checkbox } from "@core/components/ui/checkbox"

export interface CustomFormFieldProps {
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
}

const CheckboxInput: React.FC<CustomFormFieldProps & { field: ControllerRenderProps<FieldValues, string> }> = ({
  field,
  disabled,
  readOnly,
  required,
  ...props
}) => {
  return <Checkbox
  {...props}
  checked={field.value ?? false}
  onCheckedChange={field.onChange}
  disabled={disabled || readOnly}
  required={required}
/>
}

export default CheckboxInput

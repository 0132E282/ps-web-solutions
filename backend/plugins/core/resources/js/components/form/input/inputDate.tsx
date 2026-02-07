import React from "react"
import { ControllerRenderProps, FieldValues } from "react-hook-form"
import { FormControl } from "@core/components/ui/form"
import { Input } from "@core/components/ui/input"

export interface CustomFormFieldProps {
  name: string
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  readOnly?: boolean
}

const InputDate: React.FC<CustomFormFieldProps & { field: ControllerRenderProps<FieldValues, string> }> = ({
  field,
  name,
  placeholder,
  className,
  disabled,
  readOnly,
  required,
  ...props
}) => {
  return  <Input
  {...field}
  {...props}
  type="date"
  id={name}
  placeholder={placeholder}
  className={className}
  disabled={disabled}
  readOnly={readOnly}
  required={required}
/>
}

export default InputDate


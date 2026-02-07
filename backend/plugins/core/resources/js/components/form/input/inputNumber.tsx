import React from "react"
import { ControllerRenderProps, FieldValues } from "react-hook-form"
import { FormControl } from "@core/components/ui/form"
import { Input } from "@core/components/ui/input"

export interface CustomFormFieldProps extends Omit<React.ComponentProps<"input">, "name" | "type"> {
  name: string
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  readOnly?: boolean
}

const InputNumber: React.FC<CustomFormFieldProps & { field: ControllerRenderProps<FieldValues, string> }> = ({ 
  field,
  name, 
  placeholder, 
  className,
  disabled,
  required,
  readOnly,
  ...props 
}) => {
  return (
    <FormControl>
      <Input
        {...field}
        {...props}
        type="number"
        id={name}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
      />
    </FormControl>
  )
}

export default InputNumber

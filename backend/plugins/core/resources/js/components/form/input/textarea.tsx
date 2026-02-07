import React from "react"
import { ControllerRenderProps, FieldValues } from "react-hook-form"
import { FormControl } from "@core/components/ui/form"

export interface CustomFormFieldProps extends Omit<React.ComponentProps<"textarea">, "name"> {
  name: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  readOnly?: boolean
}

const Textarea: React.FC<CustomFormFieldProps & { field: ControllerRenderProps<FieldValues, string> }> = ({
  field,
  name,
  placeholder,
  disabled,
  readOnly,
  required,
  ...props
}) => {
  // Normalize value: convert null to empty string
  const normalizedValue = field.value == null ? '' : String(field.value);
  
  return (
    <FormControl>
      <textarea
        {...field}
        {...props}
        value={normalizedValue}
        id={name}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
      />
    </FormControl>
  )
}

export default Textarea

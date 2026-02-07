import React from "react"
import { ControllerRenderProps, FieldValues } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@core/components/ui/select"

export interface CustomFormFieldProps {
  name: string
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  readOnly?: boolean
  options?: { value: string; label: string }[]
}

/**
 * Extract string value from field value (handles primitive, object, null/undefined)
 */
const extractStringValue = (value: unknown): string => {
  if (value == null || value === '') return "";
  
  // Handle object values - extract id or value property
  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return String(obj.id ?? obj.value ?? "");
  }
  
  return String(value);
};

const InputSelect: React.FC<CustomFormFieldProps & { field: ControllerRenderProps<FieldValues, string> }> = ({ 
  field,
  placeholder, 
  className,
  disabled,
  readOnly,
  options = [],
}) => {
  const stringValue = React.useMemo(() => extractStringValue(field.value), [field.value]);
  
  return (
    <Select
      onValueChange={field.onChange}
      value={stringValue}
      disabled={disabled || readOnly}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder || "Select an option"} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default InputSelect

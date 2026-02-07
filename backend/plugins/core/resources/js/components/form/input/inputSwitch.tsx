import React from "react"
import { ControllerRenderProps, FieldValues } from "react-hook-form"
import { FormControl } from "@core/components/ui/form"
import { Switch } from "@core/components/ui/switch"

export interface CustomFormFieldProps {
  disabled?: boolean
  readOnly?: boolean
}

const InputSwitch: React.FC<CustomFormFieldProps & { field: ControllerRenderProps<FieldValues, string> }> = ({ 
  field,
  disabled,
  readOnly,
  ...props 
}) => {
  const checked = field.value == null ? false : Boolean(field.value);
  
  return (
    <FormControl>
      <Switch
        {...props}
        checked={checked}
        onCheckedChange={field.onChange}
        disabled={disabled || readOnly}
      />
    </FormControl>
  )
}

export default InputSwitch

import React from "react"
import { Control } from "react-hook-form"
import { FormField } from "@core/components/ui/form"
import { Input } from "@core/components/ui/input"

export interface CustomFormFieldProps {
  control: Control<any>
  name: string
  label?: string
  placeholder?: string
  description?: string
  type?: 'text' | 'email' | 'password' | 'textarea' | 'number' | 'file' | 'checkbox' | 'select' | 'radio'
  options?: { value: string; label: string }[]
  accept?: string
  multiple?: boolean
  className?: string
}

const InputEmail: React.FC<CustomFormFieldProps> = ({
  control,
  name,
  placeholder
}) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <Input
          type="email"
          placeholder={placeholder}
          {...field}
        />
      )}
    />
  )
}

export default InputEmail

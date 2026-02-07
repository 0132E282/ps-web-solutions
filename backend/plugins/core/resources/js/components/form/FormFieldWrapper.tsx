import React from "react"
import { Control, ControllerRenderProps, useFormContext } from "react-hook-form"
import { FormField, FormItem, FormControl, FormDescription, FormMessage, FormLabel } from "@core/components/ui/form"

export interface FormFieldWrapperProps {
  control?: Control<any>
  name: string
  label?: string | React.ReactNode
  description?: string
  required?: boolean
  className?: string
  wrapWithFormControl?: boolean
  render?: (field: ControllerRenderProps<any, string>) => React.ReactNode
  children?: React.ReactNode
}

export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  control: propControl,
  name,
  label,
  description,
  required,
  className,
  wrapWithFormControl = true,
  render,
  children,
}) => {
  const formContext = useFormContext()
  const control = propControl || formContext?.control

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel htmlFor={name}>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
          )}

          {wrapWithFormControl ? (
            <FormControl>
              {(render ? render(field) : children) as React.ReactElement}
            </FormControl>
          ) : (
            (render ? render(field) : children) as React.ReactElement
          )}

          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export default FormFieldWrapper

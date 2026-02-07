import React from "react";
import { type ControllerRenderProps, type FieldValues } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@core/components/ui/radio-group";
import { Label } from "@core/components/ui/label";
import { cn } from "@core/lib/utils";

export interface InputButtonRadioProps {
  field?: ControllerRenderProps<FieldValues, string>;
  name: string;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  description?: string;
  layout?: 'vertical' | 'horizontal';
}

const InputButtonRadio: React.FC<InputButtonRadioProps> = ({
  field,
  name,
  options = [],
  disabled = false,
  readOnly = false,
  layout = 'vertical'
}) => {
  const currentValue = field?.value;
  const fieldOnChange = field?.onChange;

  React.useEffect(() => {
    if (fieldOnChange && (currentValue === undefined || currentValue === null || currentValue === '') && options.length > 0 && !readOnly) {
      const firstOption = options[0];
      if (firstOption) {
        fieldOnChange(firstOption.value);
      }
    }
  }, [currentValue, fieldOnChange, options, readOnly]);

  // Normalize value: convert null to empty string
  const normalizedValue = currentValue == null ? '' : String(currentValue);

  return (
    <RadioGroup
      value={normalizedValue}
      onValueChange={readOnly ? undefined : fieldOnChange}
      disabled={disabled || readOnly}
      className={cn(
        layout === 'horizontal' ? "flex flex-wrap items-center gap-4" : "grid gap-2"
      )}
    >
      {options.map((option) => (
        <div key={option.value} className="flex items-center gap-3">
          <RadioGroupItem
            value={option.value}
            id={`${name}-${option.value}`}
            disabled={disabled || readOnly}
          />
          <Label
            htmlFor={`${name}-${option.value}`}
            className={cn(
              "font-medium",
              (disabled || readOnly) ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            )}
          >
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};

export default InputButtonRadio;

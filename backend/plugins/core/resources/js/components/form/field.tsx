import React from "react";
import { useFormContext, type ControllerRenderProps, type FieldValues } from "react-hook-form";
import { Input } from "@core/components/ui/input";
import { cn } from "@core/lib/utils";
import {
  FormField as FormFieldUI,
  FormItem,
  FormControl,
  FormDescription,
  FormMessage,
} from "@core/components/ui/form";
import { Label } from "@core/components/ui/label";
import Textarea from "./input/textarea";
import InputButtonRadio from "./input/InputButtonRadio";
import FrontendUrlsField from "./input/frontendUrls";
import InputEditor from "./input/inputEditor";
import InputSelect from "./input/inputSelect";
import InputMultiSelect from "./input/inputMultiSelect";
import InputCheckbox from "./input/InputCheckbox";
import InputAttachment from "./input/inputAttachment";
import InputMultipleAttachments from "./input/inputMultipleAttachments";
import InputSingleCondition from "./input/inputSingleCondition";
import { FieldType, type FieldProps, type BaseFieldProps, type BaseComplexFieldProps } from "@core/types/forms";
import { useQuerySource } from "@core/hooks";
import InputDateRange from './input/InputDateRange';
import type { InputSingleConditionProps } from "./input/inputSingleCondition";
import InputPassword from "./input/inputPassword";
import InputDatatableVariants from "./input/InputDatatableVariants";

type OptionItem = { value: string; label: string };

const fieldComponents = {
  'frontend-urls': FrontendUrlsField,
  'button-radio': InputButtonRadio,
  'editor': InputEditor,
  'textarea': Textarea,
  'select': InputSelect,
  'multiple-selects': InputMultiSelect,
  'password': InputPassword,
  'checkbox': InputCheckbox,
  'attachment': InputAttachment,
  'multiple-attachments': InputMultipleAttachments,
  'single-condition': InputSingleCondition,
  'date-range': InputDateRange,
  'datatable-variants': InputDatatableVariants,
} as const;

const OPTION_FIELD_TYPES: readonly FieldType[] = ['radio-group', 'button-radio', 'select', 'multiple-selects'] as const;
const COMPLEX_COMPONENTS: readonly FieldType[] = ['single-condition', 'datatable-variants'] as const;

const isOptionFieldType = (type: FieldType | undefined): type is typeof OPTION_FIELD_TYPES[number] => {
  return type !== undefined && OPTION_FIELD_TYPES.includes(type as typeof OPTION_FIELD_TYPES[number]);
};

const isComplexComponent = (type: FieldType | undefined): boolean => {
  return type !== undefined && COMPLEX_COMPONENTS.includes(type as typeof COMPLEX_COMPONENTS[number]);
};

/**
 * Extract string value from object or primitive
 * Handles objects with id/value properties or single-key objects
 */
const extractValue = (value: unknown): string => {
  if (value == null || value === '') {
    return "";
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (obj.id != null) return String(obj.id);
    if (obj.value != null) return String(obj.value);

    const keys = Object.keys(obj);
    if (keys.length === 1) {
      const firstKey = keys[0];
      if (firstKey && obj[firstKey] != null) {
        return String(obj[firstKey]);
      }
    }
    return "";
  }

  return String(value);
};

const isValidOption = (value: string, options: OptionItem[]): boolean => {
  return value !== "" && options.some(opt => opt.value === value);
};

const useFieldValueNormalization = (
  name: string,
  type: FieldType | undefined,
  options: OptionItem[],
  isLoading: boolean
) => {
  const { watch, setValue } = useFormContext();
  const currentValue = watch(name);

  React.useEffect(() => {
    if (!isOptionFieldType(type) || options.length === 0 || isLoading) {
      return;
    }

    if (type === 'multiple-selects') {
      if (!Array.isArray(currentValue)) {
        return;
      }

      const normalizedValues = currentValue
        .map(extractValue)
        .filter(v => v !== "");

      const isValid = normalizedValues.every(v => isValidOption(v, options));
      const needsUpdate = JSON.stringify(normalizedValues) !== JSON.stringify(currentValue);

      if (isValid && needsUpdate) {
        setValue(name, normalizedValues, { shouldValidate: false });
      } else if (!isValid) {
        setValue(name, [], { shouldValidate: false });
      }
    } else {
      // Single select
      if (currentValue == null || currentValue === '') {
        return;
      }

      const stringValue = extractValue(currentValue);
      const isValid = isValidOption(stringValue, options);
      const needsNormalization = typeof currentValue === 'object' || currentValue !== stringValue;

      if (isValid && needsNormalization) {
        setValue(name, stringValue, { shouldValidate: false });
      } else if (!isValid && stringValue !== "") {
        setValue(name, '', { shouldValidate: false });
      }
    }
  }, [currentValue, options, type, name, setValue, isLoading]);
};


const buildFieldProps = (
  baseProps: BaseFieldProps,
  type: FieldType | undefined,
  options: OptionItem[],
  additionalProps?: Record<string, unknown>
) => {
  return {
    ...baseProps,
    ...(isOptionFieldType(type) ? { options } : {}),
    ...additionalProps,
  };
};

/**
 * Build props for complex components
 */
const buildComplexComponentProps = (
  baseProps: BaseComplexFieldProps,
  type: FieldType | undefined,
  options: OptionItem[],
  items?: FieldProps['items'],
  headerItems?: FieldProps['header-items'],
  fields?: Record<string, unknown>
): Record<string, unknown> => {
  return {
    ...baseProps,
    ...(isOptionFieldType(type) ? { options } : {}),
    ...(type === 'multiple-attachment' ? { multiple: true } : {}),
    ...(type === 'single-condition' ? { items, 'header-items': headerItems } : {}),
    ...(type === 'datatable-variants' ? { fields } : {}),
  };
};

/**
 * Render label with multi-language support and required indicator
 */
const renderLabel = (
  label: FieldProps['label'],
  name: string,
  required?: boolean
): React.ReactElement | null => {
  if (!label) return null;

  const labelClassName = "inline-block bg-white mb-2 text-sm font-medium";
  const requiredIndicator = <span className="text-destructive ml-1 inline-block">*</span>;
  const separator = <span className="text-destructive mx-1 inline-block">*</span>;

  // Check if label is multi-language object
  const isMultiLanguage = typeof label === 'object' && label !== null && !Array.isArray(label);

  if (isMultiLanguage) {
    const labelEntries = Object.entries(label as Record<string, string>);
    return (
      <Label htmlFor={name} className={labelClassName}>
        {labelEntries.map(([lang, text], index) => (
          <React.Fragment key={lang}>
            {text}
            {required && index < labelEntries.length - 1 && separator}
          </React.Fragment>
        ))}
        {required && requiredIndicator}
      </Label>
    );
  }

  // Single language label
  const labelText = String(label);
  return (
    <Label htmlFor={name} className={labelClassName}>
      {labelText}
      {required && requiredIndicator}
    </Label>
  );
};

/**
 * Render description and message components
 */
const renderFieldMeta = (description?: string): React.ReactElement | null => {
  if (!description) return null;
  return (
    <>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </>
  );
};

/**
 * Type-safe component renderer that handles union types of different field components
 * Uses unknown instead of any for better type safety
 * This is necessary because TypeScript cannot narrow union types of different component props
 * Double assertion pattern (unknown -> target type) is safer than using any
 */
const renderFieldComponent = <T extends Record<string, unknown> = Record<string, unknown>>(
  Component: React.ComponentType<T>,
  props: Record<string, unknown>
): React.ReactElement => {
  return <Component {...(props as unknown as T)} />;
};


export const Field: React.FC<FieldProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  disabled,
  options,
  description,
  required,
  readOnly,
  source: sourceProp,
  query,
  items,
  'header-items': headerItems,
  fields,
  className,
  ...props
}) => {
  const { control } = useFormContext();

  // Fetch options from source/query
  const { options: sourceOptions, isLoading: isLoadingOptions } = useQuerySource(
    sourceProp,
    query,
    undefined
  );

  const finalOptions = React.useMemo<OptionItem[]>(() => {
    return sourceOptions.length > 0 ? sourceOptions : (options || []);
  }, [sourceOptions, options]);

  // Normalize and validate field values
  useFieldValueNormalization(name, type, finalOptions, isLoadingOptions);

  // Memoize label component
  const labelComponent = React.useMemo(
    () => renderLabel(label, name, required),
    [label, name, required]
  );

  // Render default input field
  const renderInput = React.useCallback(
    ({ field }: { field: ControllerRenderProps<FieldValues, string> }) => {
      const normalizedValue = field.value == null ? '' : field.value;

      return (
        <>
          <FormControl>
            <Input
              {...field}
              {...props}
              value={normalizedValue}
              type={type}
              id={name}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
              required={required}
            />
          </FormControl>
          {renderFieldMeta(description)}
        </>
      );
    },
    [name, type, placeholder, disabled, readOnly, required, description, props]
  );

  // Render field wrapper with label
  const renderFieldWrapper = React.useCallback(
    (renderFn: (props: { field: ControllerRenderProps<FieldValues, string> }) => React.ReactElement) => (
      <FormItem className={cn( className)}>
        {labelComponent}
        <FormFieldUI control={control} name={name} render={renderFn} />
      </FormItem>
    ),
    [labelComponent, control, name,className]
  );

  // Render custom field component with type-safe renderer
  const renderCustomField = React.useCallback(
    (componentProps: Record<string, unknown>, componentType: FieldType) => {
      const FieldComponent = fieldComponents[componentType as keyof typeof fieldComponents];

      if (componentType === 'single-condition') {
        return <InputSingleCondition {...(componentProps as unknown as InputSingleConditionProps)} />;
      }

      return renderFieldComponent(
        FieldComponent as React.ComponentType<Record<string, unknown>>,
        componentProps
      );
    },
    []
  );

  // Handle custom field components
  if (type && type in fieldComponents) {
    if (isComplexComponent(type)) {
      const complexProps = buildComplexComponentProps(
        { control, name, label, placeholder, description, disabled, required, readOnly },
        type,
        finalOptions,
        items,
        headerItems,
        fields
      );

      // Wrap complex components with FormItem and Label (similar to regular fields)
      return (
        <FormItem className={cn(className)}>
          {labelComponent}
          <FormFieldUI control={control} name={name} render={() => renderCustomField(complexProps, type)} />
          {renderFieldMeta(description)}
        </FormItem>
      );
    }

    return renderFieldWrapper(({ field }) => {
      const fieldProps = buildFieldProps(
        { name, placeholder, disabled, required, readOnly, description },
        type,
        finalOptions,
        { field, ...props }
      );

      return (
        <>
          {renderCustomField(fieldProps, type)}
          {renderFieldMeta(description)}
        </>
      );
    });
  }

  return renderFieldWrapper(renderInput);
};

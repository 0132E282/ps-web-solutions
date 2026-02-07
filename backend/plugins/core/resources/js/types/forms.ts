import { UseFormReturn, SubmitHandler } from "react-hook-form";
import { ZodSchema } from "zod";
import { ReactNode } from "react";

/**
 * Form data type - can be any record structure
 */
export type FormData = Record<string, unknown>;

/**
 * Form field type
 */
export type FormFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'password'
  | 'select'
  | 'multiple-selects'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime'
  | 'datetime-local'
  | 'textarea'
  | 'radio-group'
  | 'button-radio'
  | 'frontend-urls'
  | 'editor'
  | 'checkbox'
  | 'switch'
  | 'attachment'
  | 'multiple-attachment'
  | 'single-condition'
  | 'date-range'
  | 'datatable-variants';

/**
 * Field type alias for backward compatibility
 */
export type FieldType = FormFieldType;

/**
 * Base field props used by simple field components
 */
export interface BaseFieldProps {
  name: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  description?: string;
}

/**
 * Base complex field props used by complex field components
 */
export interface BaseComplexFieldProps extends BaseFieldProps {
  control: unknown;
  label?: string | Record<string, string>;
}

/**
 * Source configuration type (can be string or SourceConfig object)
 */
export type SourceConfigType = string | {
  route: string;
  params?: Record<string, unknown>;
  valueKey?: string;
  labelKey?: string;
};

/**
 * Query configuration type (can be string or QueryConfig object)
 */
export type QueryConfigType = string | {
  collection: string;
  filters?: Record<string, Record<string, unknown>>;
  fields?: string | string[];
};

/**
 * Field props for the Field component
 */
export interface FieldProps extends BaseFieldProps {
  label?: string | Record<string, string>;
  type?: FieldType;
  options?: Array<{ value: string; label: string }>;
  source?: SourceConfigType;
  query?: QueryConfigType;
  items?: unknown;
  'header-items'?: unknown;
  fields?: Record<string, unknown>;
  width?: string;
  className?: string;
  [key: string]: unknown;
}

/**
 * Field width configuration
 * Can be a string like 'md:50%' or an object with breakpoints
 */
export type FieldWidth =
    | string // e.g., 'md:50%', 'lg:33%'
    | {
        sm?: string;
        md?: string;
        lg?: string;
        xl?: string;
        '2xl'?: string;
      };

/**
 * Form props for FormPages component
 */
export interface FormProps {
    onSubmit?: SubmitHandler<FormData>;
    onError?: (errors: Record<string, string | string[] | undefined>) => void;
    children: ReactNode;
    defaultValues?: Partial<FormData>;
    className?: string;
    formSchema?: ZodSchema;
    title?: string;
    showHeader?: boolean;
}

/**
 * Form ref interface - methods exposed via useImperativeHandle
 */
export interface FormRef {
    setValue: (name: string, value: unknown, options?: {
        shouldValidate?: boolean;
        shouldDirty?: boolean;
        shouldTouch?: boolean
    }) => void;
    getValues: (name?: string) => unknown;
    reset: (values?: Partial<FormData>) => void;
    form: UseFormReturn<FormData>;
    handleArrayField: (name: string, value: unknown) => boolean;
    handleDelete?: () => void;
    handleDuplicate?: () => void;
    isEdit?: boolean;
    itemId?: string | null;
}

/**
 * Form field configuration
 */
export interface FormField {
    accessorKey?: string;
    name?: string;
    config?: Record<string, unknown>;
}

/**
 * Form section configuration
 */
export interface FormSectionConfig {
    type?: string; // 'section' | 'seo-section' | 'seo' | etc.
    header?: {
        title?: string;
        description?: string;
    };
    fields?: Array<string | FormField>;
}

/**
 * Form section props
 */
export interface FormSectionProps {
    section: FormSectionConfig;
    variant?: 'main' | 'sidebar';
}

/**
 * Form actions props
 */
export interface FormActionsProps {
    isEdit?: boolean;
}

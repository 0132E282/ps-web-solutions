import React, { useState } from "react"
import { Control, FieldValues } from "react-hook-form"
import { Field } from "@core/components/form"
import { FieldType, type FieldItemConfig, type ExtractedFieldProps } from "@core/types/forms"
import { tt } from "@core/lib/i18n"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@core/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@core/components/ui/button"

export interface InputSingleConditionProps {
  control: Control<FieldValues, string>
  name: string
  label?: string
  description?: string
  className?: string
  disabled?: boolean
  required?: boolean
  readOnly?: boolean
  items?: Record<string, {
    type: string
    config?: Record<string, unknown>
  }>
  'header-items'?: Record<string, {
    type: string
    config?: Record<string, unknown>
  }>
}

/**
 * Extract field configuration from item config
 */
const extractFieldProps = (
  itemKey: string,
  itemConfig: FieldItemConfig,
  baseName: string
): ExtractedFieldProps => {
  const itemName = `${baseName}.${itemKey}`;
  const itemType = (itemConfig.type || 'text') as FieldType;
  const itemLabel = (itemConfig.config?.label as string) || tt(`fields.${itemKey}`) || itemKey;
  const itemOptions = itemConfig.config?.options as Array<{ value: string; label: string }> | undefined;
  const itemRequired = (itemConfig.config?.validation as string)?.includes('required') || false;
  const itemPlaceholder = itemConfig.config?.placeholder as string | undefined;
  const itemDescription = itemConfig.config?.description as string | undefined;

  return {
    name: itemName,
    type: itemType,
    label: itemLabel,
    options: itemOptions,
    required: itemRequired,
    placeholder: itemPlaceholder,
    description: itemDescription,
  };
};

const InputSingleCondition: React.FC<InputSingleConditionProps> = ({
  name,
  className,
  disabled,
  readOnly,
  items = {},
  'header-items': headerItems = {},
}) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const hasHeaderItems = Object.keys(headerItems).length > 0
  const hasItems = Object.keys(items).length > 0

  // Render a single field item
  const renderFieldItem = (itemKey: string, itemConfig: FieldItemConfig) => {
    const fieldProps = extractFieldProps(itemKey, itemConfig, name);
    
    return (
      <Field
        key={itemKey}
        name={fieldProps.name}
        label={fieldProps.label}
        type={fieldProps.type}
        options={fieldProps.options}
        placeholder={fieldProps.placeholder}
        description={fieldProps.description}
        disabled={disabled}
        required={fieldProps.required}
        readOnly={readOnly}
        {...(itemConfig.config as Record<string, unknown>)}
      />
    );
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {hasHeaderItems && (
          <div className="space-y-4">
            {Object.entries(headerItems).map(([itemKey, itemConfig]) => 
              renderFieldItem(itemKey, itemConfig)
            )}
          </div>
        )}
        
        {hasItems && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            {hasHeaderItems && (
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between h-auto cursor-pointer p-0 font-normal hover:bg-transparent hover:text-primary"
                >
                  <span className="text-sm font-medium">
                    {hasHeaderItems ? 'Advanced Settings' : 'Details'}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            )}
            <CollapsibleContent className="space-y-4 pt-2">
              {Object.entries(items).map(([itemKey, itemConfig]) => 
                renderFieldItem(itemKey, itemConfig)
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  )
}

export default InputSingleCondition


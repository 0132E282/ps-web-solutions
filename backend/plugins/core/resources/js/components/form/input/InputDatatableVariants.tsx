import React from "react";
import { Control, FieldValues, useFieldArray, Controller } from "react-hook-form";
import { FieldType, type FieldItemConfig } from "@core/types/forms";
import { tt } from "@core/lib/i18n";
import { Button } from "@core/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@core/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@core/components/ui/card";
import { Input } from "@core/components/ui/input";

export interface InputDatatableVariantsProps {
  control: Control<FieldValues, string>;
  name: string;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  fields?: Record<string, FieldItemConfig>;
}

interface VariantField {
  name: string;
  type: FieldType;
  label: string;
  validation?: string;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

/**
 * Extract variant field configuration
 */
const extractVariantField = (
  fieldKey: string,
  fieldConfig: FieldItemConfig
): VariantField => {
  const fieldType = (fieldConfig.type || "text") as FieldType;
  const fieldLabel = (fieldConfig.config?.label as string) || tt(`fields.${fieldKey}`) || fieldKey;
  const fieldValidation = fieldConfig.config?.validation as string | undefined;
  const fieldOptions = fieldConfig.config?.options as Array<{ value: string; label: string }> | undefined;
  const fieldPlaceholder = fieldConfig.config?.placeholder as string | undefined;

  return {
    name: fieldKey,
    type: fieldType,
    label: fieldLabel,
    validation: fieldValidation,
    options: fieldOptions,
    placeholder: fieldPlaceholder,
  };
};

const InputDatatableVariants: React.FC<InputDatatableVariantsProps> = ({
  control,
  name,
  label,
  description,
  className,
  disabled = false,
  readOnly = false,
  fields = {},
}) => {
  const { fields: variantRows, append, remove } = useFieldArray({
    control,
    name,
  });

  // Extract field configurations
  const variantFields = Object.entries(fields).map(([fieldKey, fieldConfig]) =>
    extractVariantField(fieldKey, fieldConfig)
  );

  // Add new variant row
  const handleAddVariant = () => {
    const newVariant: Record<string, unknown> = {};
    variantFields.forEach((field) => {
      newVariant[field.name] = "";
    });
    append(newVariant);
  };

  // Remove variant row
  const handleRemoveVariant = (index: number) => {
    remove(index);
  };

  // Render input based on type
  const renderInput = (field: VariantField, rowIndex: number) => {
    const fieldName = `${name}.${rowIndex}.${field.name}`;
    
    return (
      <Controller
        name={fieldName}
        control={control}
        render={({ field: controllerField }) => (
          <Input
            {...controllerField}
            type={field.type === 'number' ? 'number' : 'text'}
            placeholder={field.placeholder}
            disabled={disabled}
            readOnly={readOnly}
            className="h-8"
          />
        )}
      />
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {label && <CardTitle className="text-lg">{label}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {!readOnly && !disabled && (
            <Button
              type="button"
              onClick={handleAddVariant}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              {tt("actions.add")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {variantRows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {tt("messages.no_data")}
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {variantFields.map((field) => (
                    <TableHead key={field.name}>{field.label}</TableHead>
                  ))}
                  {!readOnly && !disabled && (
                    <TableHead className="w-[80px]">{tt("actions.actions")}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {variantRows.map((row, index) => (
                  <TableRow key={row.id}>
                    {variantFields.map((field) => (
                      <TableCell key={field.name} className="p-2">
                        {renderInput(field, index)}
                      </TableCell>
                    ))}
                    {!readOnly && !disabled && (
                      <TableCell className="p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVariant(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InputDatatableVariants;

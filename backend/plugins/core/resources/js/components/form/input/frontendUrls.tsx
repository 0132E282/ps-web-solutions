import React from "react";
import { Control, FieldValues, ControllerRenderProps } from "react-hook-form";
import { FormField, FormControl } from "@core/components/ui/form";
import { Input } from "@core/components/ui/input";

export interface FrontendUrlsFieldProps {
  control: Control<FieldValues, string | string[]>;
  name: string;
  placeholder?: string;
  disabled?: boolean;
}

const FrontendUrlsField: React.FC<FrontendUrlsFieldProps> = ({
  control,
  name,
  placeholder = "Enter URL",
  disabled = false,
}) => {
  const renderField = ({ field }: { field: ControllerRenderProps<FieldValues, string> }) => {
    const fieldUrls: string[] = Array.isArray(field.value) ? field.value : [];
    
    const displayUrls: string[] = fieldUrls.length > 0 ? fieldUrls : [];

    const updateUrl = (index: number, value: string) => {
      const newUrls = [...displayUrls];
      newUrls[index] = value;
      // Update field immediately
      field.onChange(newUrls);
    };

    return <div className="space-y-2">
    {displayUrls.length > 0 ? (
      displayUrls.map((url: string, index: number) => (
        <div key={index} className="flex gap-2">
          <Input
            type="url"
            placeholder={placeholder}
            value={url}
            onChange={(e) => updateUrl(index, e.target.value)}
            disabled={disabled}
            className="flex-1"
          />
        </div>
      ))
    ) : (
      <div className="text-sm text-muted-foreground py-2">
        No frontend URLs available. URLs are generated automatically when the post is created.
      </div>
    )}
  </div>;
  };

  return <FormField
    control={control}
    name={name}
    render={renderField}
  />;
};

export default FrontendUrlsField;

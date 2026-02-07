import { Field, registerField } from "@core/components/form/field";
import { Badge } from "@core/components/ui/badge";
import { Button } from "@core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/components/ui/card";
import { Checkbox } from "@core/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormMessage } from "@core/components/ui/form";
import { Label } from "@core/components/ui/label";
import { useModule } from "@core/hooks/use-module";
import { tt } from "@core/lib/i18n";
import { toast } from "@core/lib/toast";
import { cn } from "@core/lib/utils";
import type { FieldType } from "@core/types/forms";
import { Layers, Package, Plus, Trash2, Copy } from "lucide-react";

import { useState, useMemo, useCallback } from "react";
import { useController, useFieldArray, useFormContext, useWatch, type Control } from "react-hook-form";

/**
 * Interface representing a Product Variation
 */
export interface Variation {
    id: string | number;
    product_id?: string | number;
    name: string;
    product_name: string;
    sku: string;
    barcode: string;
    weight: number;
    unit: string;
    image?: string;
    stock_on_hand: number;
    stock_available: number;
    attribute_name: string;
    attribute_value: string;

    // Pricing
    price: number;
    price_retail: number;
    price_wholesale: number;
    compare_at_price: number;
    price_agency_c3?: number;
    price_staff?: number;
    events?: number;
    price_import: number;

    // Settings
    allow_sale: boolean;
    apply_tax: boolean;
    is_default: boolean;

    // Relationships
    options?: unknown[];
}

/**
 * Interface for Field Configuration
 */
export interface VariationFieldConfig {
    name: string;
    ui?: string;
    config?: {
        label?: string;
        validation?: string;
        [key: string]: string | number | boolean | Record<string, unknown> | undefined;
    };
}

export interface InputDataVariationProps {
    variations?: Variation[];
    onChange?: (variations: Variation[]) => void;
    fields?: (string | VariationFieldConfig)[];
    className?: string;
    parentName?: string;
    item?: string[];
}

/**
 * Utility to format currency in VND
 */
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export function InputDataVariation({
    fields: dynamicFields = [],
    className,
    parentName = 'variations',
    item: itemConfig,
}: InputDataVariationProps) {
    const { configs: moduleConfigs } = useModule({ collection: 'admin.product-variants' });
    const { control, getValues, setValue } = useFormContext();

    const { fields: variationFields, append, remove } = useFieldArray({
        control,
        name: parentName,
    });

    // Watch field array for real-time value updates
    const watchedValues = useWatch({
        control,
        name: parentName,
    });

    // Merge stable field IDs with watched values for display
    const displayVariations = useMemo(() =>
        variationFields.map((field, index) => ({
            ...field,
            ...(watchedValues?.[index] || {})
        } as Variation)),
    [variationFields, watchedValues]);

    const [selectedId, setSelectedId] = useState<string | number | null>(() =>
        displayVariations[0]?.id ?? null
    );

    // Resolve dynamic fields with fallbacks and type safety
    const resolvedFields = useMemo((): VariationFieldConfig[] => {
        return dynamicFields.map((field) => {
            const fieldObj: VariationFieldConfig = typeof field === 'string' ? { name: field } : field;
            const fieldName = fieldObj.name;
            const moduleField = moduleConfigs?.[fieldName] as VariationFieldConfig | undefined;

            const resolved: VariationFieldConfig = {
                name: fieldName,
                ui: fieldObj.ui || moduleField?.ui || 'text',
                config: {
                    ...(moduleField?.config || {}),
                    ...(fieldObj.config || {}),
                },
            };

            // Specialized handling for 'image' field
            if (fieldName === 'image' && resolved.ui === 'text') {
                resolved.ui = 'attachment';
                resolved.config = {
                    ...resolved.config,
                    label: resolved.config?.label || 'Hình ảnh',
                };
            }

            return resolved;
        });
    }, [dynamicFields, moduleConfigs]);

    // Derived current selection
    const finalSelectedIndex = useMemo(() => {
        const index = displayVariations.findIndex(v => v.id === selectedId);
        return index >= 0 ? index : 0;
    }, [displayVariations, selectedId]);

    const selectedVariation = displayVariations[finalSelectedIndex];

    // Ensure we have a selection if possible
    if (selectedId === null && displayVariations.length > 0) {
        const firstId = displayVariations[0]?.id;
        if (firstId !== undefined) {
            setSelectedId(firstId);
        }
    }

    const handleAddVariation = useCallback(() => {
        const newVariation: Variation = {
            id: Date.now(),
            name: `${parentName} - Phiên bản mới ${displayVariations.length + 1}`,
            stock_available: 0,
            stock_on_hand: 0,
            sku: "",
            attribute_value: "",
            price: 0,
            price_retail: 0,
            price_wholesale: 0,
            price_compare: 0,
            price_import: 0,
            compare_at_price: 0,
            allow_sale: true,
            apply_tax: true,
            is_default: displayVariations.length === 0,
            options: [],
            product_name: "",
            barcode: "",
            weight: 0,
            unit: "",
            attribute_name: "",
        };

        append(newVariation);
        setSelectedId(newVariation.id);
        toast("Đã thêm phiên bản mới.", "success");
    }, [append, displayVariations.length, parentName]);

    const handleDuplicateVariation = useCallback(() => {
        if (!selectedVariation) return;

        const newVariation: Variation = {
            ...selectedVariation,
            id: Date.now(),
            name: `${selectedVariation.name} (Copy)`,
            is_default: false,
        };

        append(newVariation);
        setSelectedId(newVariation.id);
        toast("Đã nhân bản biến thể.", "success");
    }, [append, selectedVariation]);

    const handleDeleteVariation = useCallback(() => {
        if (!selectedVariation) return;

        if (!confirm("Bạn có chắc chắn muốn xoá phiên bản này?")) return;

        const index = displayVariations.findIndex(v => v.id === selectedVariation.id);
        if (index > -1) {
            remove(index);

            // Logic to select next available variation
            let nextId: string | number | null = null;
            if (displayVariations.length > 1) {
                const nextCandidate = displayVariations[index + 1] || displayVariations[index - 1];
                nextId = nextCandidate?.id ?? null;
            }
            setSelectedId(nextId);
        }
    }, [displayVariations, remove, selectedVariation]);

    const handleIsDefaultChange = useCallback((checked: boolean) => {
        if (checked) {
            // Uncheck all other variations directly in form state
            const currentVariations = getValues(parentName) as Variation[];
            if (Array.isArray(currentVariations)) {
                currentVariations.forEach((_, idx) => {
                    if (idx !== finalSelectedIndex) {
                        setValue(`${parentName}.${idx}.is_default`, false);
                    }
                });
            }
        }
        setValue(`${parentName}.${finalSelectedIndex}.is_default`, checked);
    }, [finalSelectedIndex, getValues, parentName, setValue]);

    return (
        <div className={cn("flex flex-col h-full lg:max-h-[600px]", className)}>
            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
                {/* Left Sidebar: Variations List */}
                <div className="col-span-12 lg:col-span-4 overflow-hidden h-full flex flex-col">
                    <Card className="border shadow-none flex-1 overflow-hidden ring-0 flex flex-col">
                        <CardHeader className="sticky top-0 z-20 py-3 px-3 bg-slate-50 border-b space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                        <Layers className="size-4 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-slate-800 tracking-tight">Danh sách phiên bản</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">
                                        {displayVariations.length} Items
                                    </span>
                                    <Button
                                        variant="default"
                                        size="icon"
                                        className="size-6 h-6 w-6 rounded-full"
                                        onClick={handleAddVariation}
                                        type="button"
                                    >
                                        <Plus className="size-3" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-full custom-scrollbar min-h-0">
                            {displayVariations.map((variant, idx) => {
                                const isActive = selectedId === variant.id;
                                return (
                                    <div
                                        key={variant.id}
                                        className={cn(
                                            "group flex items-start gap-3 p-3 cursor-pointer transition-all relative overflow-hidden",
                                            isActive ? "bg-primary text-primary-foreground shadow-sm" : "bg-white hover:bg-slate-50"
                                        )}
                                        onClick={() => setSelectedId(variant.id)}
                                    >
                                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30" />}

                                        <div className={cn(
                                            "size-10 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden transition-transform group-hover:scale-105",
                                            isActive ? "border-white/20 bg-white/10" : "border-slate-200 bg-slate-50"
                                        )}>
                                            {(!itemConfig || itemConfig.includes('image')) && variant.image ? (
                                                <img src={variant.image} alt={variant.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className={cn("size-5", isActive ? "text-primary-foreground/80" : "text-slate-400")} />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <div className={cn(
                                                "font-semibold text-sm leading-none mb-1 flex items-center gap-1.5 min-w-0",
                                                isActive ? "text-primary-foreground" : "text-slate-700"
                                            )}>
                                                <span className="truncate flex-1">
                                                    {(!itemConfig || itemConfig.includes('name')) ? (variant.name || `Phiên bản ${idx + 1}`) : ''}
                                                    {(!itemConfig || itemConfig.includes('sku')) && variant.sku ? ` - ${variant.sku}` : ''}
                                                </span>
                                                {variant.is_default && (
                                                    <Badge variant="secondary" className={cn(isActive ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground")}>
                                                        {tt('default')}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className={cn("text-xs font-medium flex items-center gap-1.5", isActive ? "text-primary-foreground/90" : "text-primary")}>
                                                {(!itemConfig || itemConfig.includes('price')) && (
                                                    <span className={isActive ? "text-primary-foreground/90" : "text-slate-600"}>
                                                        {formatCurrency(variant.price ?? 0)}
                                                    </span>
                                                )}
                                                {(!itemConfig || itemConfig.includes('compare_at_price')) && (variant.compare_at_price ?? 0) > 0 && (
                                                    <span className={cn("line-through opacity-70", isActive ? "text-primary-foreground/80" : "text-slate-400")}>
                                                        {formatCurrency(variant.compare_at_price ?? 0)}
                                                    </span>
                                                )}
                                                {itemConfig?.filter(key => !['name', 'sku', 'price', 'compare_at_price', 'image'].includes(key)).map(key => (
                                                    <span key={key} className="opacity-80">
                                                        {String(variant[key as keyof Variation] ?? '')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Right Panel: Variation Form */}
                <div className="col-span-12 lg:col-span-8 h-full overflow-hidden">
                    {selectedVariation ? (
                        <div className="h-full animate-in fade-in slide-in-from-right-2 duration-300">
                            <Card className="h-full border shadow-sm ring-0 overflow-hidden rounded-xl flex flex-col">
                                <CardHeader className="sticky top-0 z-20 py-3 px-6 bg-white border-b border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                <Package className="size-4.5 text-primary" />
                                            </div>
                                            <div className="min-w-0 overflow-hidden">
                                                <CardTitle className="text-base font-bold text-slate-800 truncate">Cấu hình biến thể</CardTitle>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest truncate">{selectedVariation.name}</p>
                                            </div>
                                        </div>
                                        <div className="ms-auto flex items-center gap-2">
                                            <Button variant="outline" size="icon" onClick={handleDuplicateVariation} title="Nhân bản" type="button">
                                                <Copy className="size-4" />
                                            </Button>
                                            <Button variant="destructive" size="icon" onClick={handleDeleteVariation} title="Xoá" type="button">
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 overflow-y-auto flex-1 bg-slate-50/30 min-h-0">
                                    <div className="flex flex-col gap-4">
                                        {resolvedFields.map((field) => {
                                            const fieldPath = `${parentName}.${finalSelectedIndex}.${field.name}`;

                                            if (field.name === 'is_default') {
                                                return (
                                                    <div key={field.name} className="space-y-1.5">
                                                        <FormField
                                                            control={control}
                                                            name={fieldPath}
                                                            render={({ field: formField }) => (
                                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={!!formField.value}
                                                                            onCheckedChange={handleIsDefaultChange}
                                                                        />
                                                                    </FormControl>
                                                                    <div className="space-y-1 leading-none">
                                                                        <Label className="text-sm font-medium leading-none cursor-pointer">
                                                                            {field.config?.label as string}
                                                                        </Label>
                                                                    </div>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={field.name} className="space-y-1.5">
                                                    <Field
                                                        {...(field.config || {})}
                                                        name={fieldPath}
                                                        type={field.ui as FieldType}
                                                        label={field.config?.label as string}
                                                        placeholder={field.config?.label as string}
                                                        className="transition-all duration-200"
                                                        required={field.config?.validation === 'required'}
                                                        rules={field.config?.validation === 'required' ? { required: 'Vui lòng nhập thông tin' } : undefined}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <Card className="h-full border border-dashed shadow-none flex flex-col items-center justify-center p-12 bg-slate-50/50 rounded-xl">
                            <div className="size-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                <Layers className="size-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa chọn phiên bản</h3>
                            <p className="text-slate-400 text-sm max-w-[250px] text-center">
                                Vui lòng chọn một phiên bản từ danh sách bên trái để bắt đầu chỉnh sửa.
                            </p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Hook Form Integrated Field for Data Variations
 */
export const DataVariationField = ({
    name,
    control,
    fields: rawFields,
    className,
    item,
    ...props
}: {
    name: string;
    control: Control<Record<string, unknown>>;
    fields: InputDataVariationProps['fields'];
    className?: string;
    item?: string[];
    [key: string]: unknown
}) => {
    const { field } = useController({ name, control });
    const { configs } = useModule({ collection: 'admin.product-variants' });

    // Normalize field configurations
    const normalizedFields = useMemo(() => {
        if (!Array.isArray(rawFields)) return [];

        return rawFields.map((field) => {
            if (typeof field === 'string') {
                const config = (configs as Record<string, VariationFieldConfig | undefined>)?.[field];
                return {
                    name: field,
                    ui: config?.ui || 'text',
                    config: {
                        label: config?.config?.label || field,
                        ...(config?.config || {})
                    }
                } as VariationFieldConfig;
            }
            return field;
        });
    }, [rawFields, configs]);

    return (
        <InputDataVariation
            variations={field.value as Variation[]}
            onChange={field.onChange}
            fields={normalizedFields}
            parentName={field.name}
            className={className}
            item={item}
            {...props}
        />
    );
};

registerField('data-variation', DataVariationField);


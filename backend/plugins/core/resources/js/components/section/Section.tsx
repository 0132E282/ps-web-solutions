import { Field } from '@core/components/form/field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@core/components/ui/card';
import { tt } from '@core/lib/i18n';
import type { FormSectionProps, FormFieldType, FieldWidth } from '@core/types/forms';
import { useFormContext } from 'react-hook-form';
import { useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { shouldShowField } from '@core/utils/field-visibility';
import type { SharedData } from '@core/types';
import { cn } from '@core/lib/utils';
import { useModule } from "@core/hooks/use-module";

const getFieldName = (field: { name?: unknown; accessorKey?: unknown }): string => {
    if (typeof field.name === 'string') return field.name;
    if (typeof field.accessorKey === 'string') return field.accessorKey;
    return '';
};

/**
 * Generate width classes from width configuration
 * Default is 100% (full width)
 */
function getWidthClasses(width: FieldWidth | undefined): string {
    if (!width) {
        return 'w-full';
    }

    // Handle common shorthand aliases with static strings for Tailwind JIT detection
    if (typeof width === 'string') {
        if (width === 'sm') return 'w-full md:w-[calc(33.333%-0.66rem)]';
        if (width === 'md') return 'w-full md:w-[calc(50%-0.5rem)]';
        if (width === 'lg') return 'w-full md:w-[calc(66.666%-0.33rem)]';
        if (width === 'full' || width === '100%') return 'w-full';

        // Keep fallback for legacy formats, though JIT might not pick these up if dynamic
        const parts = width.split(':');
        if (parts.length === 2) {
            const [breakpoint, val] = parts;
            return `${breakpoint}:w-[${val}]`;
        }
        return `w-[${width}]`;
    }

    // Handle object format (less common but supported)
    const classes: string[] = ['w-full'];
    if (width.sm) {
        if (width.sm === 'md') classes.push('sm:w-[calc(50%-0.5rem)]');
        else classes.push(`sm:w-[${width.sm}]`);
    }
    if (width.md) {
        if (width.md === 'md') classes.push('md:w-[calc(50%-0.5rem)]');
        else classes.push(`md:w-[${width.md}]`);
    }
    if (width.lg) {
        if (width.lg === 'md') classes.push('lg:w-[calc(50%-0.5rem)]');
        else classes.push(`lg:w-[${width.lg}]`);
    }

    return cn(...classes);
}

/**
 * Extract field names used in filters for watching
 */
function getFilterFieldNames(fields: Array<{ config?: Record<string, unknown> }>): string[] {
    const fieldNames = new Set<string>();
    fields.forEach((field) => {
        const filter = field.config?.filter as Record<string, unknown> | undefined;
        if (filter && typeof filter === 'object') {
            Object.keys(filter).forEach((key) => fieldNames.add(key));
        }
    });

    return Array.from(fieldNames);
}

export function Section({ section }: FormSectionProps) {
    const { watch } = useFormContext();
    const { props } = usePage<SharedData>();
    const { getFieldOptions, configs } = useModule();
    const user = props.auth?.user || null;
    const item = (props as { item?: { id?: string | number } })?.item;
    const isEdit = !!item?.id;

    // Normalize fields: convert string fields to objects and merge with model configs
    const allFields = useMemo((): Array<{
        name: string;
        accessorKey: string;
        config?: Record<string, unknown>;
    }> => {
        const fields = section.fields || [];
        return fields.map((field) => {
            // If field is a string, convert to object
            if (typeof field === 'string') {
                const fieldName = field;
                const modelConfig = configs?.[fieldName];
                // Ưu tiên ui > type
                const ui = modelConfig?.ui;
                const type = modelConfig?.type;
                return {
                    name: fieldName,
                    accessorKey: fieldName,
                    config: {
                        type: ui || type || 'text',
                        ui: ui,
                        label: modelConfig?.config?.label,
                        ...(modelConfig?.config || {}),
                    },
                };
            }

            // If field is already an object, ensure it has name/accessorKey
            const fieldObj = field as Record<string, unknown> & { name?: unknown; accessorKey?: unknown };

            // Safely extract field name as string
            const fieldName = getFieldName(fieldObj);

            // Merge with model configs if available
            if (fieldName && configs?.[fieldName]) {
                const modelConfig = configs[fieldName] as Record<string, unknown>;
                const existingConfig = typeof fieldObj.config === 'object' && fieldObj.config !== null
                    ? (fieldObj.config as Record<string, unknown>)
                    : {};

                // Ưu tiên ui > type, ưu tiên field.config.ui nếu có
                const ui = existingConfig.ui || modelConfig?.ui;
                const type = existingConfig.type || modelConfig?.type;
                return {
                    ...fieldObj,
                    name: fieldName,
                    accessorKey: fieldName,
                    config: {
                        type: ui || type || 'text',
                        ui: ui,
                        ...(modelConfig?.config as Record<string, unknown> || {}),
                        ...existingConfig,
                    },
                };
            }

            // Ensure field has at least name/accessorKey
            if (!fieldName) {
                return {
                    ...fieldObj,
                    name: '',
                    accessorKey: '',
                };
            }

            return {
                ...fieldObj,
                name: fieldName,
                accessorKey: fieldName,
            };
        });
    }, [section.fields, configs]);

    // Get field names used in filters
    const filterFieldNames = useMemo(
        () => getFilterFieldNames(allFields),
        [allFields]
    );

    // Watch all fields that are used in filters to trigger re-render
    const watchedValues = filterFieldNames.length > 0
        ? watch(filterFieldNames)
        : {};

    const allFormValues = watch();

    const fields = useMemo(() => {
        return allFields.filter((field) => {
            const fieldName = getFieldName(field);

            // Hide frontend_urls field when creating (only show when editing)
            if (fieldName === 'frontend_urls' && !isEdit) {
                return false;
            }

            const fieldConfig = field.config as Record<string, unknown> | undefined;
            const filter = fieldConfig?.filter as Record<string, unknown> | undefined;
            return shouldShowField(filter, allFormValues, user);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allFields, allFormValues, watchedValues, user, isEdit]);

    if (fields.length === 0) return null;

    return (
        <Card>
            {section.header && (
                <CardHeader>
                    <CardTitle>{section.header.title || ''}</CardTitle>
                    {section.header.description && (
                        <CardDescription>{section.header.description}</CardDescription>
                    )}
                </CardHeader>
            )}
            <CardContent>
                <div className="flex flex-wrap gap-4">
                    {fields.map((field, fieldIndex) => {
                        const fieldConfig = field.config as Record<string, unknown> | undefined;
                        const width = (fieldConfig?.width || (field as Record<string, unknown>).width) as FieldWidth | undefined;
                        const fieldName = getFieldName(field);
                        const fieldLabel = (fieldConfig?.label as string) || tt(`fields.${fieldName}`) || fieldName;
                        const fieldOptions = getFieldOptions(field as Record<string, unknown>, fieldName) as Array<{ value: string; label: string }> | undefined;

                        // Prioritize UI > Options (Select) > Type > Text
                        const fieldType = (fieldConfig?.ui || (fieldOptions?.length ? 'select' : fieldConfig?.type) || 'text') as FormFieldType;

                        return (
                            <div key={fieldIndex} className={getWidthClasses(width)}>
                                <Field
                                    {...(field.config as Record<string, unknown>)}
                                    name={fieldName}
                                    label={fieldLabel}
                                    options={fieldOptions}
                                    type={fieldType}
                                />
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

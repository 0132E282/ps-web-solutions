import { shouldShowField } from '@core/utils/field-visibility';
import type { SharedData } from '@core/types';
import type { FormSectionProps, FormFieldType, FieldWidth } from '@core/types/forms';
import { Field } from '@core/components/form/field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@core/components/ui/card';
import { useModule } from "@core/hooks/use-module";
import { tt } from '@core/lib/i18n';
import { cn } from '@core/lib/utils';
import { usePage } from '@inertiajs/react';
import { useFormContext } from 'react-hook-form';

import React, { useMemo } from 'react';
const getFieldName = (field: any): string => {
    if (typeof field === 'string') return field;
    return (field?.name || field?.accessorKey || '') as string;
};

/**
 * Generate width classes from width configuration
 * Default is 100% (full width)
 */
function getWidthClasses(width: FieldWidth | undefined): string {
    if (!width) return 'w-full';

    if (typeof width === 'string') {
        const staticWidths: Record<string, string> = {
            'sm': 'w-full md:w-[calc(33.333%-0.66rem)]',
            'md': 'w-full md:w-[calc(50%-0.5rem)]',
            'lg': 'w-full md:w-[calc(66.666%-0.33rem)]',
            'full': 'w-full',
            '100%': 'w-full',
        };

        if (staticWidths[width]) return staticWidths[width];

        const parts = width.split(':');
        if (parts.length === 2) {
            const [breakpoint, val] = parts;
            return `${breakpoint}:w-[${val}]`;
        }
        return `w-[${width}]`;
    }

    const classes: string[] = ['w-full'];
    (Object.keys(width) as Array<keyof typeof width>).forEach((bp) => {
        const val = width[bp];
        if (val === 'md') classes.push(`${bp}:w-[calc(50%-0.5rem)]`);
        else if (val) classes.push(`${bp}:w-[${val}]`);
    });

    return cn(classes);
}

/**
 * Extract field names used in filters for watching
 */
function getFilterFieldNames(fields: Array<{ config?: Record<string, any> }>): string[] {
    const fieldNames = new Set<string>();
    fields.forEach((field) => {
        const filter = field.config?.filter;
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
    const item = (props as any)?.item;
    const isEdit = !!item?.id;

    // Normalize fields: merge with model configs and resolve properties once
    const allFields = useMemo(() => {
        const fields = section.fields || [];
        return fields.map((field) => {
            const fieldName = getFieldName(field);
            const fieldObj = typeof field === 'string' ? {} : (field as Record<string, any>);
            const modelConfig = configs?.[fieldName] || {};
            const existingConfig = (fieldObj.config || {}) as Record<string, any>;

            // Resolve Type/UI
            const ui = existingConfig.ui || modelConfig.ui;
            const type = existingConfig.type || modelConfig.type;

            // Merge Config
            const config = {
                ...(modelConfig.config || {}),
                ...existingConfig,
                type: ui || type || 'text',
                ui,
            } as Record<string, any>;

            // Resolve Label & Options
            const label = (config.label as string) || tt(`fields.${fieldName}`) || fieldName;
            const options = getFieldOptions(field as any, fieldName) as Array<{ value: string; label: string }> | undefined;
            const finalType = (ui || (options?.length ? 'select' : type) || 'text') as FormFieldType;

            return {
                ...fieldObj,
                name: fieldName,
                label,
                options,
                type: finalType,
                config,
                width: config.width as FieldWidth | undefined,
            };
        });
    }, [section.fields, configs, getFieldOptions]);

    // Optimize: only watch fields used in filters
    const filterNames = useMemo(() => getFilterFieldNames(allFields), [allFields]);
    const watchedValues = watch(filterNames);

    // Map watched values back to object for shouldShowField
    const filterFormValues = useMemo(() => {
        return filterNames.reduce((acc, name, i) => {
            acc[name] = watchedValues[i];
            return acc;
        }, {} as Record<string, any>);
    }, [filterNames, watchedValues]);

    const visibleFields = useMemo(() => {
        return allFields.filter((field) => {
            // Edit-only field
            if (field.name === 'frontend_urls' && !isEdit) return false;

            // Visibility filter
            return shouldShowField(field.config?.filter, filterFormValues, user);
        });
    }, [allFields, filterFormValues, user, isEdit]);

    if (visibleFields.length === 0) return null;

    return (
        <Card>
            {section.header && (
                <CardHeader className="sticky top-16 z-20 py-4 rounded-t-xl transition-all">
                    <CardTitle>{section.header.title || ''}</CardTitle>
                    {section.header.description && (
                        <CardDescription>{section.header.description}</CardDescription>
                    )}
                </CardHeader>
            )}
            <CardContent>
                <div className="flex flex-wrap gap-4 items-end">
                    {visibleFields.map((field, index) => (
                        <div key={`${field.name}-${index}`} className={getWidthClasses(field.width)}>
                            <Field
                                {...field.config}
                                name={field.name}
                                label={field.label}
                                options={field.options}
                                type={field.type}
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}


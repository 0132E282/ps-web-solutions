import { Field } from '@core/components/form/field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@core/components/ui/card';
import { Button } from '@core/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { tt } from '@core/lib/i18n';
import type { FormSectionProps, FormFieldType, FieldWidth } from '@core/types/forms';
import { useFormContext } from 'react-hook-form';
import { useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { shouldShowField } from '@core/utils/field-visibility';
import type { SharedData } from '@/types';
import { cn } from '@core/lib/utils';

const VALID_FIELD_TYPES: FormFieldType[] = ['text', 'email', 'password', 'select', 'number', 'date', 'textarea', 'radio-group', 'frontend-urls'];

const getFieldType = (type: string): FormFieldType => {
    return VALID_FIELD_TYPES.includes(type as FormFieldType)
        ? (type as FormFieldType)
        : 'text';
};

/**
 * Generate width classes from width configuration
 */
function getWidthClasses(width: FieldWidth | undefined): string {
    if (!width) {
        return 'w-full';
    }

    if (typeof width === 'string') {
        const parts = width.split(':');
        if (parts.length === 2) {
            const [breakpoint, percentage] = parts;
            return `${breakpoint}:w-[${percentage}]`;
        }
        return `w-[${width}]`;
    }

    const classes: string[] = [];
    if (width.sm) classes.push(`sm:w-[${width.sm}]`);
    if (width.md) classes.push(`md:w-[${width.md}]`);
    if (width.lg) classes.push(`lg:w-[${width.lg}]`);
    if (width.xl) classes.push(`xl:w-[${width.xl}]`);
    if (width['2xl']) classes.push(`2xl:w-[${width['2xl']}]`);

    return classes.length > 0 ? cn('w-full', ...classes) : 'w-full';
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

export function SeoSection({ section, variant = 'main' }: FormSectionProps) {
    const { watch } = useFormContext();
    const { props } = usePage<SharedData>();
    const user = props.auth?.user || null;
    const [isExpanded, setIsExpanded] = useState(false);
    const allFields = useMemo(() => section.fields || [], [section.fields]);

    // Watch SEO fields for preview
    const seoTitle = watch('seo.title') || watch('og_title') || '';
    const seoDescription = watch('seo.description') || watch('og_description') || '';
    const seoImage = watch('seo.image') || watch('og_image') || '';
    const metaTitle = watch('meta_title') || seoTitle;
    const metaDescription = watch('meta_description') || seoDescription;
    const metaImage = watch('meta_image') || seoImage;

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
            const filter = field.config?.filter as Record<string, unknown> | undefined;
            return shouldShowField(filter, allFormValues, user);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allFields, allFormValues, watchedValues, user]);

    // Separate preview fields and detail fields
    const previewFields = useMemo(() => {
        return fields.filter(field => {
            const fieldName = field.name || field.accessorKey || '';
            return ['meta_title', 'og_title', 'seo.title', 'meta_image', 'og_image', 'seo.image', 'meta_description', 'og_description', 'seo.description'].includes(fieldName);
        });
    }, [fields]);

    const detailFields = useMemo(() => {
        return fields.filter(field => {
            const fieldName = field.name || field.accessorKey || '';
            return !['meta_title', 'og_title', 'seo.title', 'meta_image', 'og_image', 'seo.image', 'meta_description', 'og_description', 'seo.description'].includes(fieldName);
        });
    }, [fields]);

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
                {previewFields.length > 0 && (
                    <div className="flex flex-wrap gap-4 mb-4">
                        {previewFields.map((field, fieldIndex) => {
                            const width = field.config?.width as FieldWidth | undefined;
                            const widthClasses = getWidthClasses(width);
                            const fieldName = field.name || field.accessorKey || '';
                            const fieldLabel = (field.config?.label as string) || tt(`fields.${fieldName}`) || fieldName;
                            const fieldType = getFieldType((field.config?.type as string) || 'text');
                            const fieldOptions = field.config?.options as Array<{ value: string; label: string }> | undefined;
                            return (
                                <div key={fieldIndex} className={widthClasses}>
                                    <Field
                                        name={fieldName}
                                        label={fieldLabel}
                                        type={fieldType}
                                        options={fieldOptions}
                                        {...(field.config as Record<string, unknown>)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Detail Fields (collapsible) */}
                {detailFields.length > 0 && (
                    <>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-full justify-between mb-4"
                        >
                            <span>{isExpanded ? 'Ẩn chi tiết' : 'Xem thêm'}</span>
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>

                        {isExpanded && (
                            <div className="flex flex-wrap gap-4">
                                {detailFields.map((field, fieldIndex) => {
                                    const width = field.config?.width as FieldWidth | undefined;
                                    const widthClasses = getWidthClasses(width);
                                    const fieldName = field.name || field.accessorKey || '';
                                    const fieldLabel = (field.config?.label as string) || tt(`fields.${fieldName}`) || fieldName;
                                    const fieldType = getFieldType((field.config?.type as string) || 'text');
                                    const fieldOptions = field.config?.options as Array<{ value: string; label: string }> | undefined;

                                    return (
                                        <div key={fieldIndex} className={widthClasses}>
                                            <Field
                                                name={fieldName}
                                                label={fieldLabel}
                                                type={fieldType}
                                                options={fieldOptions}
                                                {...(field.config as Record<string, unknown>)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

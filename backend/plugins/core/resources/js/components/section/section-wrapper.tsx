import React from 'react';
import { Section as SectionComponent } from './Section';
import { SeoSection as SeoSectionComponent } from './seo-section';
import type { FormSectionProps } from '@core/types/forms';

type SectionComponentType = React.ComponentType<FormSectionProps>;

// Mapping section types to components
const sectionComponents = {
    'section': SectionComponent,
    'seo-section': SeoSectionComponent,
    'seo': SeoSectionComponent,
    'default': SectionComponent,
} as const;

export type SectionType = keyof typeof sectionComponents;

/**
 * Get section component by type
 */
export function getSectionComponent(type?: string): SectionComponentType {
    if (!type) return sectionComponents.default;
    return sectionComponents[type as SectionType] || sectionComponents.default;
}

/**
 * Dynamic Section component that renders based on type
 */
export function Section({ section, variant = 'main' }: FormSectionProps) {
    const sectionType = (section as { type?: string })?.type || 'default';
    // eslint-disable-next-line react/no-unstable-nested-components
    const Component: SectionComponentType = getSectionComponent(sectionType);

    return <Component section={section} variant={variant} />;
}

// Export individual components
export { SectionComponent, SeoSectionComponent };
export { default as FormActions } from './form-actions';

import AppLayoutTemplate from '@core/layouts/app-sidebar-layout';
import { type BreadcrumbItem } from '@core/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    toolbar?: ReactNode;
    form?: 'table' | 'form';
}

export default ({ children, breadcrumbs, toolbar, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} toolbar={toolbar} {...props}>
        {children}
    </AppLayoutTemplate>
);


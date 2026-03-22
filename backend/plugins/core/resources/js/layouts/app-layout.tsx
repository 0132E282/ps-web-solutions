import ToolbarTable from '@core/components/toolbar/toolbar-table-page';
import ToolbarForm from '@core/components/toolbar/toolbar-form-page';
import AppLayoutTemplate from '@core/layouts/app-sidebar-layout';
import { type BreadcrumbItem } from '@core/types';
import { type ReactNode, isValidElement, useMemo } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    toolbar?: ReactNode | {
        ui?: 'table' | 'tree' | 'form';
        actions?: any;
        layouts?: string[];
        tabnavs?: any[];
        locale?: boolean;
    };
    viewMode?: string;
    onViewModeChange?: (mode: string) => void;
    form?: 'table' | 'form';
}

export default ({ children, breadcrumbs, toolbar, viewMode, onViewModeChange, ...props }: AppLayoutProps) => {
    const renderedToolbar = useMemo(() => {
        if (!toolbar) return null;
        if (isValidElement(toolbar)) return toolbar;
        if (typeof toolbar === 'object') {
            const config = toolbar as any;
            if (config.ui === 'form') {
                return <ToolbarForm {...config} />;
            }
            return (
                <ToolbarTable 
                    {...config} 
                    viewMode={viewMode} 
                    onViewModeChange={onViewModeChange} 
                />
            );
        }
        return toolbar as ReactNode;
    }, [toolbar, viewMode, onViewModeChange]);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} toolbar={renderedToolbar} {...props}>
            {children}
        </AppLayoutTemplate>
    );
};


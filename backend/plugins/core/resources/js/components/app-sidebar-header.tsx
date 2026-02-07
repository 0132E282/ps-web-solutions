import { Breadcrumbs } from '@core/components/breadcrumbs';
import { SidebarTrigger } from '@core/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { ReactNode } from 'react';

export function AppSidebarHeader({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItemType[];
    children?: ReactNode;
}) {
    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur px-6 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            {children}
        </header>
    );
}

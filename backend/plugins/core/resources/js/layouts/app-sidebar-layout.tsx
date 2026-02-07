import { type BreadcrumbItem } from '@core/types/common';
import { AppContent } from '@core/components/app-content';
import { AppShell } from '@core/components/app-shell';
import { AppSidebar } from '@core/components/app-sidebar';
import { AppSidebarHeader } from '@core/components/app-sidebar-header';
import LanguageSwitcher from '@core/components/language-switcher';
import { ReactNode, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { getCurrentRouteName } from '@core/lib/route';
import { getBreadcrumbs } from '@core/lib/breadcrumbs';
import type { BasePageProps } from '@core/types/common';

interface AppSidebarLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    toolbar?: ReactNode;
}

export default function AppSidebarLayout({
    children,
    breadcrumbs: providedBreadcrumbs,
    toolbar,
}: AppSidebarLayoutProps) {
    const { props } = usePage<BasePageProps>();
    const currentRouteName = props.ziggy?.route?.name || getCurrentRouteName() || null;

    // Get breadcrumbs from config or generate from route
    const breadcrumbs = useMemo(() => {
        return getBreadcrumbs(providedBreadcrumbs, currentRouteName);
    }, [providedBreadcrumbs, currentRouteName]);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="flex min-h-screen flex-col overflow-x-hidden"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs}>
                    <div className="flex items-center gap-2 ml-auto">
                        {toolbar}
                        <LanguageSwitcher />
                    </div>
                </AppSidebarHeader>
                <div className="mx-auto w-full flex-1 px-4 py-6 md:px-6 lg:px-8">
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}


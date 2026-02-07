import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Clock,
    FileText,
    Folder,
    Globe,
    Key,
    Layers,
    LayoutGrid,
    LucideIcon,
    Package,
    Settings,
    Settings2,
    User,
    Users
} from 'lucide-react';
import AppLogo from './app-logo';

// Map string icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
    LayoutGrid,
    FileText,
    Package,
    Settings2,
    Layers,
    User,
    Globe,
    Users,
    Settings,
    Key,
    Clock,
    Folder,
    BookOpen
};

export function AppSidebar() {
    const { sidebar } = usePage<any>().props;
    const { isCurrentUrl } = useCurrentUrl();

    // Helper to transform backend item to frontend NavItem
    const transformItem = (item: any): NavItem => {
        const transformedChildren = item.children ? item.children.map(transformItem) : undefined;
        const href = item.url || '#';

        // Determine if this item or any of its children are active
        const isSelfActive = isCurrentUrl(href);
        const isChildActive = transformedChildren?.some((child: NavItem) => child.isActive);

        return {
            title: item.title,
            href: href,
            icon: item.icon ? iconMap[item.icon] : undefined,
            items: transformedChildren,
            isActive: isSelfActive || isChildActive
        };
    };

    const mainNavItems = (sidebar?.top || []).map(transformItem);
    const bottomNavItems = (sidebar?.bottom || []).map(transformItem);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                {/* Render bottom items if any, potentially as another group or appended */}
                 {bottomNavItems.length > 0 && <NavMain items={bottomNavItems} />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

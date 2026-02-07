import { type LucideIcon } from 'lucide-react';

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    items?: NavItem[];
}

export interface SidebarItem {
    title: string;
    url: string;
    icon?: string;
    route_name?: string;
    badge?: string | number;
    children?: SidebarItem[];
}

export interface SidebarData {
    top: SidebarItem[];
    bottom: SidebarItem[];
    account?: SidebarItem[];
}

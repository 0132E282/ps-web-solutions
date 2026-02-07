import { ChevronRight } from 'lucide-react';
import { Icon } from '@core/components/icon';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@core/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@core/components/ui/sidebar';
import { resolveUrl } from "@core/lib/utils";
import { type NavItem } from '@core/types';
import { type ComponentPropsWithoutRef } from 'react';
import { Link } from '@inertiajs/react';

export function NavFooter({
    items,
    className,
    ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
}) {
    return (
        <SidebarGroup
            {...props}
            className={`group-data-[collapsible=icon]:p-0 ${className || ''}`}
        >
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item, index) => {
                        const hasChildren = item.items && item.items.length > 0;

                        if (hasChildren) {
                            return (
                                <Collapsible
                                    key={item.title}
                                    asChild
                                    defaultOpen={item.isActive}
                                    className="group/collapsible"
                                    style={{
                                        animation: `fadeInSlideFooter 0.3s ease-out ${index * 0.05}s both`
                                    }}
                                >
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton>
                                                {item.icon && (
                                                    <Icon
                                                        iconNode={item.icon}
                                                        className="h-5 w-5"
                                                    />
                                                )}
                                                <span>{item.title}</span>
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {item.items?.map((subItem, subIndex) => (
                                                    <SidebarMenuSubItem
                                                        key={subItem.title}
                                                        style={{
                                                            animation: `fadeInSlideFooter 0.2s ease-out ${subIndex * 0.03}s both`
                                                        }}
                                                    >
                                                        <SidebarMenuSubButton asChild>
                                                            <Link href={resolveUrl(subItem.href)}>
                                                                {subItem.icon && (
                                                                    <Icon
                                                                        iconNode={subItem.icon}
                                                                        className="h-4 w-4"
                                                                    />
                                                                )}
                                                                <span>{subItem.title}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            );
                        }

                        return (
                            <SidebarMenuItem
                                key={item.title}
                                style={{
                                    animation: `fadeInSlideFooter 0.3s ease-out ${index * 0.05}s both`
                                }}
                            >
                                <SidebarMenuButton
                                    asChild
                                >
                                    <Link href={resolveUrl(item.href)}>
                                        {item.icon && (
                                            <Icon
                                                iconNode={item.icon}
                                                className="h-5 w-5"
                                            />
                                        )}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}


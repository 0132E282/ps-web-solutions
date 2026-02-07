"use client"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@core/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@core/components/ui/sidebar"
import { Link, usePage } from "@inertiajs/react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { useMemo } from "react"

interface NavItem {
  title: string
  href?: string | object
  icon?: LucideIcon | null
  isActive?: boolean
  items?: NavItem[]
  badge?: string | number
}


export function NavMain({
  items,
  label,
  searchQuery,
}: {
  items: NavItem[]
  label?: string
  searchQuery?: string
}) {
  const { url } = usePage()

  const currentPath = useMemo(() => {
    try {
      return new URL(url, 'http://localhost').pathname
    } catch {
      return url
    }
  }, [url])

  const checkIsActive = (href?: string | object): boolean => {
    if (!href || typeof href !== "string" || href === "#") return false

    const pathname = href.startsWith('http') ? new URL(href).pathname : href
    return currentPath === pathname || currentPath.startsWith(`${pathname}/`)
  }

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item, index) => {
          const isItemActive = item.isActive || checkIsActive(item.href)
          const hasActiveChild = item.items?.some(sub => checkIsActive(sub.href)) ?? false
          const shouldExpand = isItemActive || hasActiveChild || (!!searchQuery && item.items && item.items.length > 0)

          return (
            <Collapsible
              key={item.title}
              defaultOpen={shouldExpand}
              className="group/collapsible"
              style={{
                animation: `fadeInSlide 0.3s ease-out ${index * 0.05}s both`
              }}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} isActive={isItemActive}>
                    {item.icon && (
                      <item.icon
                        className={isItemActive ? 'animate-pulse-glow' : ''}
                      />
                    )}
                    {item.items?.length ? (
                      <>
                        <span>{item.title}</span>
                        {item.badge !== undefined && item.badge !== null && Number(item.badge) > 0 && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary ring-1 ring-inset ring-primary/20">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </>
                    ) : (
                      <Link href={item.href as string} className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{item.title}</span>
                        </div>
                        {item.badge !== undefined && item.badge !== null && Number(item.badge) > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}

                  </SidebarMenuButton>
                </CollapsibleTrigger>
                {item.items && item.items.length > 0 && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem, subIndex) => (
                        <SidebarMenuSubItem
                          key={subItem.title}
                          style={{
                            animation: `fadeInSlide 0.2s ease-out ${subIndex * 0.03}s both`
                          }}
                        >
                          <SidebarMenuSubButton asChild isActive={checkIsActive(subItem.href)}>
                            <Link href={subItem.href as string}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

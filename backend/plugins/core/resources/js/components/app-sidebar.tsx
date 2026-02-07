import { NavFooter } from "@core/components/nav-footer"
import { NavMain } from "@core/components/nav-main"
import { NavUser } from "@core/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@core/components/ui/sidebar"
import { tt } from '@core/lib/i18n'
import { getIconComponent } from "@core/lib/icons"
import { cn } from "@core/lib/utils"
import { type NavItem, type User as UserType } from '@core/types'
import { type SidebarItem } from '@core/types/sidebar'
import { Link, usePage } from '@inertiajs/react'
import { Search } from "lucide-react"
import * as React from "react"

interface NavItemWithItems extends NavItem {
  items?: NavItemWithItems[]
  badge?: string | number
}


// Extend Window interface for debug flag
declare global {
  interface Window {
    __LUCIDE_ICONS_LOGGED?: boolean
  }
}

interface SidebarPageProps {
  sidebar?: {
    top: SidebarItem[]
    bottom: SidebarItem[]
    account?: SidebarItem[]
  }
  auth: {
    user: UserType
  }
  unreadNotificationCount?: number
  [key: string]: unknown
}


const convertItem = (item: SidebarItem, unreadCount?: number): NavItemWithItems => {
  const isNotificationRoute = item.route_name === 'admin.notifications.index' || item.url?.includes('notifications');

  return {
    title: item.title || (item.route_name ? tt(item.route_name) : ''),
    href: item.url || '#',
    icon: item.icon ? getIconComponent(item.icon) : null,
    items: item.children?.map(child => convertItem(child, unreadCount)),
    badge: isNotificationRoute && unreadCount ? unreadCount : item.badge,
  }
}


function SidebarLogo() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <SidebarMenuButton
      size="lg"
      asChild
      className={!collapsed ? "h-auto hover:bg-transparent active:bg-transparent" : "hover:bg-transparent active:bg-transparent"}
    >
      <Link href="/">
        <img
          src={collapsed ? "/logo-icon.svg" : "/logo.svg"}
          alt="Web Solutions"
          className={cn(
            !collapsed
              ? "h-20 w-auto max-w-[280px] object-contain"
              : "size-12 object-contain"
          )}
        />
      </Link>
    </SidebarMenuButton>
  )
}

const filterItems = (items: NavItemWithItems[], query: string): NavItemWithItems[] => {
  if (!query) return items

  return items
    .map((item) => {
      const matchesTitle = item.title.toLowerCase().includes(query.toLowerCase())
      const filteredChildren = item.items ? filterItems(item.items, query) : undefined
      const hasMatchingChildren = filteredChildren && filteredChildren.length > 0

      if (matchesTitle || hasMatchingChildren) {
        return {
          ...item,
          items: filteredChildren,
        } as NavItemWithItems
      }
      return null
    })
    .filter((item): item is NavItemWithItems => item !== null)
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebar, auth, unreadNotificationCount } = usePage<SidebarPageProps>().props
  const user = auth?.user
  const [searchQuery, setSearchQuery] = React.useState("")

  const topNavItems = React.useMemo(() => sidebar?.top?.map(item => convertItem(item, unreadNotificationCount)) ?? [], [sidebar?.top, unreadNotificationCount])
  const bottomNavItems = React.useMemo(() => sidebar?.bottom?.map(item => convertItem(item, unreadNotificationCount)) ?? [], [sidebar?.bottom, unreadNotificationCount])
  const accountMenu = React.useMemo(() => sidebar?.account ?? [], [sidebar?.account])

  const filteredTopNavItems = React.useMemo(() => filterItems(topNavItems, searchQuery), [topNavItems, searchQuery])
  const filteredBottomNavItems = React.useMemo(() => filterItems(bottomNavItems, searchQuery), [bottomNavItems, searchQuery])


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarLogo />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarGroup className="py-0 group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none text-sidebar-primary" />
            <SidebarInput
              placeholder="Tìm kiếm..."
              className="pl-8 border-sidebar-primary focus-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        {filteredTopNavItems.length > 0 && <NavMain items={filteredTopNavItems} label="" searchQuery={searchQuery} />}
      </SidebarContent>

      <SidebarFooter>
        {filteredBottomNavItems.length > 0 && <NavFooter items={filteredBottomNavItems} />}
        <NavUser user={user} accountMenu={accountMenu} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

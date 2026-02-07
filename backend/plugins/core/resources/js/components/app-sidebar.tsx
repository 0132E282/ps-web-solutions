import * as React from "react"
import { getIconComponent } from "@core/lib/icons"
import { NavMain } from "@core/components/nav-main"
import { NavFooter } from "@core/components/nav-footer"
import { NavUser } from "@core/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@core/components/ui/sidebar"
import { type NavItem, type User as UserType } from '@core/types'
import { type SidebarItem } from '@core/types/sidebar'
import { Link, usePage } from '@inertiajs/react'
import { tt } from '@core/lib/i18n'
import { cn } from "@core/lib/utils"

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
  const [isRectangular, setIsRectangular] = React.useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('sidebar_logo_rect') === 'true';
    }
    return false;
  })

  return (
    <SidebarMenuButton
      size="lg"
      asChild
      className={isRectangular && !collapsed ? "h-auto hover:bg-transparent active:bg-transparent" : ""}
    >
      <Link href="/">
        <img
          src="/logo.svg"
          alt="PS Ecommerce"
          className={cn(
            isRectangular && !collapsed
              ? "h-10 w-auto max-w-full object-contain"
              : "aspect-square size-8 rounded-lg object-contain bg-sidebar-primary"
          )}
          onLoad={(e) => {
            const img = e.currentTarget
            const isRect = img.naturalWidth > img.naturalHeight
            if (isRect !== isRectangular) {
              setIsRectangular(isRect)
              localStorage.setItem('sidebar_logo_rect', String(isRect))
            }
          }}
        />
        {(!isRectangular || collapsed) && (
           <div className={cn("grid flex-1 text-left text-base leading-tight", collapsed && "hidden")}>
             <span className="truncate font-semibold">PS Ecommerce</span>
             <span className="truncate text-xs">Enterprise</span>
           </div>
        )}
      </Link>
    </SidebarMenuButton>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebar, auth, unreadNotificationCount } = usePage<SidebarPageProps>().props
  const user = auth?.user

  const topNavItems = React.useMemo(() => sidebar?.top?.map(item => convertItem(item, unreadNotificationCount)) ?? [], [sidebar?.top, unreadNotificationCount])
  const bottomNavItems = React.useMemo(() => sidebar?.bottom?.map(item => convertItem(item, unreadNotificationCount)) ?? [], [sidebar?.bottom, unreadNotificationCount])
  const accountMenu = React.useMemo(() => sidebar?.account ?? [], [sidebar?.account])


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarLogo />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {topNavItems.length > 0 && <NavMain items={topNavItems} label="" />}
      </SidebarContent>

      <SidebarFooter>
        {bottomNavItems.length > 0 && <NavFooter items={bottomNavItems} />}
        <NavUser user={user} accountMenu={accountMenu} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

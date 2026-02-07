import {
  LogOutIcon,
  MoreVerticalIcon,
  User, Circle, Settings, Bell, Mail, Calendar, HelpCircle,
  Shield, Key, Lock, CreditCard, Wallet, Gift, Award,
  type LucideIcon,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@core/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@core/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@core/components/ui/sidebar"
import { Link } from "@inertiajs/react"
import { type SidebarItem } from "@core/types/sidebar"

// Helper: Convert icon name to PascalCase
const toPascalCase = (str: string): string => {
  if (!/[-_\s]/.test(str)) {
    return str
  }
  return str
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

// Icon map for dynamic lookup
const iconMap: Record<string, LucideIcon> = {
  User, Circle, Settings, Bell, Mail, Calendar, HelpCircle,
  Shield, Key, Lock, CreditCard, Wallet, Gift, Award,
  LogOut: LogOutIcon,
}

// Dynamic icon loader - synchronous lookup from icon map
const getIconComponent = (iconName: string): LucideIcon | null => {
  if (!iconName) return null

  const normalizedName = toPascalCase(iconName)
  let icon = iconMap[normalizedName]

  if (!icon) {
    icon = iconMap[normalizedName + 'Icon']
  }

  if (!icon && normalizedName.endsWith('Icon')) {
    icon = iconMap[normalizedName.replace(/Icon$/, '')]
  }

  return icon || Circle
}

export function NavUser({
  user,
  accountMenu = [],
}: {
  user?: {
    name: string
    email: string
    avatar?: string
  }
  accountMenu?: SidebarItem[]
}) {
  const { isMobile } = useSidebar()
  if (!user) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-white data-[state=open]:text-foreground hover:bg-white hover:text-foreground transition-colors"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {accountMenu.length > 0 && (
              <>
                <DropdownMenuGroup>
                {accountMenu.map((item, index) => {
                    const Icon = item.icon ? getIconComponent(item.icon) : null
                    return (
                      <DropdownMenuItem key={index} asChild>
                        <Link href={item.url} className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            {Icon && <Icon className="mr-2 h-4 w-4" />}
                            {item.title}
                          </div>
                          {item.badge !== undefined && item.badge !== null && Number(item.badge) > 0 && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary ring-1 ring-inset ring-primary/20">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/logout" method="post" as="button" className="w-full">
                <LogOutIcon className="mr-2 h-4 w-4" />
                Đăng xuất
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

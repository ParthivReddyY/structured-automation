"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { useNotifications } from "@/contexts/notification-context"
import { type Icon } from "@tabler/icons-react"
import {
  IconCalendar,
  IconChecklist,
  IconHome,
  IconInnerShadowTop,
  IconMail,
  IconPlaylistX,
  IconUser,
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
  IconSettings,
  IconMoon,
  IconSun,
} from "@tabler/icons-react"
import { Bell, Search } from "lucide-react"
import { AuthModal } from "@/components/auth-modal"
import { NotificationsPanel } from "@/components/notifications-panel"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

// Import page components
import HomePage from "@/components/pages/home"
import ActionsPage from "@/components/pages/actions"
import TodosPage from "@/components/pages/todos"
import CalendarPage from "@/components/pages/calendar"
import MailsPage from "@/components/pages/mails"
import ProfilePage from "@/components/pages/profile"
import SettingsPage from "@/components/pages/settings"

// Navigation data
const navigationData = {
  navMain: [
    {
      title: "Home",
      key: "home",
      icon: IconHome,
    },
    {
      title: "Actions",
      key: "actions",
      icon: IconPlaylistX,
    },
    {
      title: "To-do's",
      key: "todos",
      icon: IconChecklist,
    },
    {
      title: "Calendar",
      key: "calendar",
      icon: IconCalendar,
    },
    {
      title: "Mails",
      key: "mails",
      icon: IconMail,
    },
    
  ],
  navFooter: [
    {
      title: "Profile",
      key: "profile",
      icon: IconUser,
    },
    {
      title: "Settings",
      key: "settings",
      icon: IconSettings,
    },
  ],
}

// Create context for navigation
const NavigationContext = React.createContext<{
  currentPage: string
  setCurrentPage: (page: string) => void
}>({
  currentPage: "home",
  setCurrentPage: () => {},
})

// Navigation Menu Component
function NavMain({
  items,
}: {
  items: {
    title: string
    key: string
    icon?: Icon
  }[]
}) {
  const { currentPage, setCurrentPage } = React.useContext(NavigationContext)

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                tooltip={item.title} 
                onClick={() => setCurrentPage(item.key)}
                isActive={currentPage === item.key}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

// User Navigation Component
function NavUser() {
  const { isMobile } = useSidebar()
  const { data: session } = useSession()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const handleProfileClick = () => {
    if (!session) {
      setShowAuthModal(true)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                onClick={handleProfileClick}
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage 
                    src={session?.user?.image || ''} 
                    alt={session?.user?.name || 'User'} 
                  />
                  <AvatarFallback className="rounded-lg">
                    {session?.user?.name?.charAt(0).toUpperCase() || 'G'}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {session?.user?.name || 'Guest'}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {session?.user?.email || 'Not signed in'}
                  </span>
                </div>
                <IconDotsVertical className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            {session && (
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage 
                        src={session.user?.image || ''} 
                        alt={session.user?.name || 'User'} 
                      />
                      <AvatarFallback className="rounded-lg">
                        {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{session.user?.name}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {session.user?.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <IconUserCircle />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconCreditCard />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconNotification />
                    Notifications
                  </DropdownMenuItem>
                  {mounted && (
                    <DropdownMenuItem onClick={toggleTheme}>
                      {theme === 'dark' ? <IconSun /> : <IconMoon />}
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <IconLogout />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  )
}

// App Sidebar Component
function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setCurrentPage } = React.useContext(NavigationContext)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setCurrentPage("home")}
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <IconInnerShadowTop className="!size-5" />
              <span className="text-base font-semibold">Structured Automation</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavMain items={navigationData.navFooter} />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

// Site Header Component
function SiteHeader() {
  const { currentPage } = React.useContext(NavigationContext)
  const { theme, setTheme } = useTheme()
  const { unreadCount } = useNotifications()
  const [mounted, setMounted] = useState(false)
  const currentPageTitle = navigationData.navMain.find(nav => nav.key === currentPage)?.title || "Dashboard"

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink>
                Structured Automation
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md ml-auto mr-4">
          <div className="relative w-full">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search documents, tasks..." className="pl-8" />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {mounted && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
            </Button>
          )}
          <NotificationsPanel>
            <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </NotificationsPanel>
        </div>
      </div>
    </header>
  )
}

// Page Content Renderer
function PageContent({ currentPage }: { currentPage: string }) {
  // Special handling for home page to give it full viewport access
  if (currentPage === "home") {
    return <HomePage />
  }
  
  // Regular page content wrapper for other pages
  return (
    <div className="px-4 lg:px-6">
      {(() => {
        switch (currentPage) {
          case "actions":
            return <ActionsPage />
          case "todos":
            return <TodosPage />
          case "calendar":
            return <CalendarPage />
          case "mails":
            return <MailsPage />
          case "profile":
            return <ProfilePage />
          case "settings":
            return <SettingsPage />
          default:
            return <HomePage />
        }
      })()}
    </div>
  )
}

// Main Dashboard Application Component
export function DashboardApp() {
  const [currentPage, setCurrentPage] = useState("home")

  // Handle URL hash changes for bookmarking/direct navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "")
      if (hash && navigationData.navMain.some(nav => nav.key === hash)) {
        setCurrentPage(hash)
      }
    }

    // Set initial page from URL hash
    handleHashChange()
    
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  // Update URL hash when page changes
  useEffect(() => {
    if (currentPage !== "home") {
      window.location.hash = currentPage
    } else {
      window.location.hash = ""
    }
  }, [currentPage])

  return (
    <NavigationContext.Provider value={{ currentPage, setCurrentPage }}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col">
              {currentPage === "home" ? (
                <PageContent currentPage={currentPage} />
              ) : (
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  <PageContent currentPage={currentPage} />
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NavigationContext.Provider>
  )
}
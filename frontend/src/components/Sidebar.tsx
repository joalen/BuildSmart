import { NavLink, useNavigate } from 'react-router-dom'
import { Home, PenLine, Receipt, ShoppingCart, Settings, Plus, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'

const navItems = [
  { label: 'Home',     path: '/home',     icon: Home },
  { label: 'Plan',     path: '/plan',     icon: PenLine },
  { label: 'Cost',     path: '/cost',     icon: Receipt },
  { label: 'Cart',     path: '/cart',     icon: ShoppingCart },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export default function AppSidebar() {
  const navigate = useNavigate()

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5">
        <span className="text-xl font-bold text-white">BuildSmart</span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navItems.map(({ label, path, icon: Icon }) => (
            <SidebarMenuItem key={path}>
              <NavLink to={path}>
                {({ isActive }) => (
                  <SidebarMenuButton isActive={isActive}>
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="gap-2 p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => navigate('/plan')}
        >
          <Plus className="w-4 h-4" />
          New Project
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
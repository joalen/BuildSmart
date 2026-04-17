import { NavLink, useNavigate } from 'react-router-dom'
import { Home, PenLine, Receipt, ShoppingCart, Settings, Plus, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'

const navItems = [
  { label: 'Home', path: '/home', icon: Home },
  { label: 'Plan', path: '/plan', icon: PenLine },
  { label: 'Cost', path: '/cost', icon: Receipt, requiresPlan: true },
  { label: 'Cart', path: '/cart', icon: ShoppingCart, requiresPlan: true },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export default function AppSidebar() {
  const navigate = useNavigate()
  const planReady = localStorage.getItem('planReady') === 'true'

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <img src="/assets/logo.png" alt="BuildSmart" className="h-25 w-auto" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map(({ label, path, icon: Icon, requiresPlan }) => { 
            const disabled = requiresPlan && !planReady

            return (
              <SidebarMenuItem key={path}>
                <NavLink to={path} onClick={e => disabled && e.preventDefault()} aria-disabled={disabled}>
                  {({ isActive }) => (
                    <SidebarMenuButton isActive={isActive}>
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="gap-2 p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-foreground border-white/20"
            onClick={() => {
              localStorage.removeItem('planReady')
              navigate('/plan')
            }}
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
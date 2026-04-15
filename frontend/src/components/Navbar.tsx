import { LayoutGrid, MessageCircle, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavbarProps {
  title?: string
}

export default function Navbar({ title = 'New Project' }: NavbarProps) {
  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-background shrink-0">
      {/* Left */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon">
          <LayoutGrid className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <MessageCircle className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="w-4 h-4" />
        </Button>
        <img
          src="https://i.pravatar.cc/32"
          alt="Avatar"
          className="w-8 h-8 rounded-full ml-2 cursor-pointer"
        />
      </div>
    </header>
  )
}
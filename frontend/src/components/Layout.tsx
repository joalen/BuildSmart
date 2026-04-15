import { Outlet } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import AppSidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout() {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full overflow-hidden">
                <AppSidebar />
                <div className="flex flex-col flex-1 min-h-0">
                    <Navbar />
                    <main className="flex-1 p-6 min-h-0">
                        <Outlet />
                    </main>
                </div>
            </div>
        </SidebarProvider>
    )
}
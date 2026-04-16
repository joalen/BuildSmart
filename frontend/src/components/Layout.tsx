import { Outlet } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import AppSidebar from './Sidebar'
import Navbar from './Navbar'
import { useBackendReady } from '@/hooks/useBackendReady'

export default function Layout() {
    const { ready, checking, error } = useBackendReady()


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

            {checking && !ready && !error && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent mb-4" />
                    <p className="text-gray-700 font-medium">Starting backend…</p>
                    <p className="text-gray-400 text-sm mt-1">This takes ~15s on first boot</p>
                </div>
            )}

            {error && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                    <div className="text-red-500 text-4xl mb-4">⚠</div>
                    <p className="text-gray-800 font-semibold">Backend failed to start</p>
                    <p className="text-red-400 text-sm mt-2 max-w-sm text-center">{error}</p>
                </div>
            )}
        </SidebarProvider>
    )
}
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Account() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
      <div className="w-full max-w-xl space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Account</h1>
          <p className="text-muted-foreground text-sm">
            Basic account information for the current user.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border bg-white p-4">
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium">{user.email || 'No email saved'}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="font-medium">
              {user.loggedIn ? 'Logged in' : 'Demo user'}
            </p>
          </div>
        </div>

        <Button
          className="w-full"
          variant="outline"
          onClick={() => navigate('/plan')}
        >
          Back to Project Planner
        </Button>
      </div>
    </div>
  )
}
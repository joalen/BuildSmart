import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const passwordRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

const handleSubmit = async () => {
  if (!email.includes('@')) {
    alert('Please enter a valid email address.')
    return
  }

  const response = await fetch('http://localhost:8000/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    alert('Account not found or invalid password')
    return
  }

  const user = await response.json()

  localStorage.setItem('user', JSON.stringify(user))
  navigate('/plan')
}

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">BuildSmart</h1>
          <p className="text-muted-foreground text-sm">
            Log in to start planning your project.
          </p>
        </div>

        <div className="space-y-4">
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                passwordRef.current?.focus()
              }
            }}
            placeholder="Email"
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
          />

          <input
            ref={passwordRef}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleSubmit()
              }
            }}
            placeholder="Password"
            type="password"
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
          />

          <Button className="w-full" onClick={handleSubmit}>
            Log In
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/create-account" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        </div>

            
        {/* 
        <p className="text-center text-xs text-muted-foreground">
        Temporary demo login. Any input will continue.
        </p>
        */}
      </div>
    </div>
  )
}
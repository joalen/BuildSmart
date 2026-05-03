import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProjects = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}')

      if (!user.id) return

      const res = await fetch(
        `http://localhost:8000/projects?user_id=${user.id}`
      )

      const data = await res.json()
      setProjects(data)
    }

    fetchProjects()
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">My Projects</h1>

      {projects.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No saved projects yet.
        </p>
      )}

      <div className="space-y-3">
        {projects.map((p) => (
          <div
            key={p.id}
            className="border rounded-lg p-4 cursor-pointer hover:bg-muted"
            onClick={() =>
              navigate('/plan/result', {
                state: {
                  ...p.plan,
                  input: p.input,
                },
              })
            }
          >
            <p className="font-medium">{p.input}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(p.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
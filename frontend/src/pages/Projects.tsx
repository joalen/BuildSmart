import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editedName, setEditedName] = useState('')
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

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this project?')

    if (!confirmDelete) return

    await fetch(`http://localhost:8000/projects/${id}`, {
      method: 'DELETE',
    })

    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  const handleStartEdit = (project: any) => {
    setEditingId(project.id)
    setEditedName(project.input || '')
  }

  const handleSaveEdit = async (id: number) => {
    await fetch(`http://localhost:8000/projects/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: editedName,
      }),
    })

    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, input: editedName } : p
      )
    )

    setEditingId(null)
    setEditedName('')
  }

const getIcon = (input: string) => {
  const text = input.toLowerCase()

  if (text.includes('kitchen')) return '🍳'
  if (text.includes('bathroom') || text.includes('shower')) return '🛁'
  if (text.includes('deck') || text.includes('patio') || text.includes('backyard')) return '🏡'
  if (text.includes('paint') || text.includes('wall')) return '🎨'
  if (text.includes('garden') || text.includes('yard')) return '🌱'
  if (text.includes('floor')) return '🪵'

  return '🛠️'
}

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6">
        <img
          src="/assets/logo.png"
          alt="BuildSmart Logo"
          className="h-20 w-auto"
        />
      </div>

      <h2 className="text-2xl font-semibold mb-8">My Saved Projects</h2>

      {projects.length === 0 && (
        <p className="text-muted-foreground">No saved projects yet.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {projects.map((p) => (
          <div
            key={p.id}
            className="bg-white border rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            onClick={() =>
              navigate('/plan/result', {
                state: {
                  ...p.plan,
                  input: p.input,
                },
              })
            }
          >
            <div className="h-32 rounded-lg mb-4 flex items-center justify-center bg-orange-100 text-5xl">
              {getIcon(p.input || '')}
            </div>

            {editingId === p.id ? (
              <div onClick={(e) => e.stopPropagation()}>
                <input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full border rounded-md p-2 text-lg font-bold"
                />

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleSaveEdit(p.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => {
                      setEditingId(null)
                      setEditedName('')
                    }}
                    className="bg-gray-300 px-3 py-1 rounded-md text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold">
                  {p.input || 'Project Title'}
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  Saved on {new Date(p.created_at).toLocaleDateString()}
                </p>

                <div
                  className="flex gap-3 mt-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleStartEdit(p)}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-6">
        <button
          onClick={() => navigate('/plan')}
          className="bg-gray-300 hover:bg-gray-400 rounded-full w-14 h-14 text-3xl"
        >
          ←
        </button>

        <button
          onClick={() => navigate('/plan')}
          className="bg-gray-300 hover:bg-gray-400 rounded-full w-14 h-14 text-3xl"
        >
          +
        </button>

        <button
          className="bg-gray-300 hover:bg-gray-400 rounded-full w-14 h-14 text-3xl"
        >
          →
        </button>
      </div>
    </div>
  )
}
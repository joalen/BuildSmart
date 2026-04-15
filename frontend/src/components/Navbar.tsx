import { useState, useRef, useEffect } from 'react'
import { LayoutGrid, MessageCircle, Bell, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavbarProps {
    title?: string
}

export default function Navbar() {
    const [title, setTitle] = useState('New Project')
    const [isEditing, setIsEditing] = useState(false)
    const [draft, setDraft] = useState(title)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isEditing) inputRef.current?.focus()
    }, [isEditing])

    const handleSave = () => {
        setTitle(draft.trim() || 'New Project')
        setIsEditing(false)
    }

    return (
        <header className="h-14 border-b flex items-center justify-between px-6 bg-background shrink-0">
            {/* Left */}
            <div className="flex items-center gap-3">
                {isEditing ? (
                    <input
                        ref={inputRef}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleSave()
                            if (e.key === 'Escape') { setDraft(title); setIsEditing(false) }
                        }}
                        className="text-sm font-medium bg-transparent border-b border-primary outline-none w-40"
                    />
                ) : (
                    <button
                        onClick={() => { setDraft(title); setIsEditing(true) }}
                        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground group"
                    >
                        {title}
                        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </button>
                )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon"><LayoutGrid className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon"><MessageCircle className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon"><Bell className="w-4 h-4" /></Button>
                <img src="https://i.pravatar.cc/32" alt="Avatar" className="w-8 h-8 rounded-full ml-2 cursor-pointer" />
            </div>
        </header>
    )
}
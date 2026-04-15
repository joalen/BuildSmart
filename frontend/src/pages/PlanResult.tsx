import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { RotateCcw, ArrowRight, Package, Wrench, ListChecks, AlignLeft } from 'lucide-react'

interface Material { id: number; name: string; quantity: string; unit: string }
interface Tool { id: number; name: string }
interface Step { id: number; title: string; description: string }
interface PlanData { overview: string; materials: Material[]; tools: Tool[]; steps: Step[]; input: string }

const PREVIEW_COUNT = 3

export default function PlanResult() {
  const location = useLocation()
  const navigate = useNavigate()
  const { steps, materials, tools, overview, input } = location.state as PlanData
  const [expanded, setExpanded] = useState(false)
  const visibleSteps = expanded ? steps : steps.slice(0, PREVIEW_COUNT)

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-5xl mx-auto space-y-5">

        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Your project plan</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-2xl border text-sm text-muted-foreground bg-muted">
              {input}
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => navigate('/plan')} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Start over
            </Button>
            <Button onClick={() => navigate('/cost', { state: { steps, materials, tools, overview, input } })} className="gap-2">
              Next: Cost estimate
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Steps', value: steps.length },
            { label: 'Materials', value: materials.length },
            { label: 'Tools', value: tools.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-muted rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        {/* Overview */}
        <div className="bg-card border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlignLeft className="w-4 h-4 text-primary" />
            Overview
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{overview}</p>
        </div>

        {/* Materials + Tools grid */}
        <div className="grid grid-cols-2 gap-3">

          {/* Materials */}
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-primary" />
              </div>
              Materials
            </div>
            <div className="divide-y">
              {materials.map(m => (
                <div key={m.id} className="flex justify-between py-2 text-sm">
                  <span>{m.name}</span>
                  <span className="text-muted-foreground">{m.quantity} {m.unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-blue-600" />
              </div>
              Tools
            </div>
            <div className="flex flex-wrap gap-2">
              {tools.map(t => (
                <span key={t.id} className="px-2.5 py-1 rounded-full border text-xs bg-muted text-muted-foreground">
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <ListChecks className="w-4 h-4 text-primary" />
            </div>
            Step-by-step instructions
          </div>
          <div className="divide-y">
            {visibleSteps.map(step => (
              <div key={step.id} className="flex gap-3 py-3 items-start">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium shrink-0 mt-0.5">
                  {step.id}
                </div>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          {steps.length > PREVIEW_COUNT && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full text-center text-sm text-primary pt-3 hover:underline"
            >
              {expanded ? 'Show less ↑' : `Show ${steps.length - PREVIEW_COUNT} more steps ↓`}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
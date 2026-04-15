import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, RotateCcw, ArrowRight } from 'lucide-react'

interface Step {
    id: number
    title: string
    description: string
}

const PREVIEW_COUNT = 3

export default function PlanResult() {
    const location = useLocation()
    const navigate = useNavigate()
    const { steps, input } = location.state as { steps: Step[]; input: string }
    const [expanded, setExpanded] = useState(false)

    const visibleSteps = expanded ? steps : steps.slice(0, PREVIEW_COUNT)
    const remaining = steps.length - PREVIEW_COUNT

    return (
        <div className="h-full overflow-y-auto">
            <div className="flex flex-col items-center justify-start min-h-full px-4 py-12 overflow-y-auto">
                <div className="w-full max-w-2xl space-y-6">

                    {/* Header */}
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold">Your project plan</h1>
                        <p className="text-muted-foreground text-sm">
                            {steps.length} steps generated based on your description
                        </p>
                    </div>

                    {/* Project chip */}
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full border text-sm text-muted-foreground bg-muted">
                        {input}
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${(visibleSteps.length / steps.length) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Showing {visibleSteps.length} of {steps.length} steps
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="space-y-3">
                        {visibleSteps.map((step) => (
                            <div
                                key={step.id}
                                className="flex gap-4 bg-card border rounded-xl p-4 items-start"
                            >
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium shrink-0 mt-0.5">
                                    {step.id}
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-sm">{step.title}</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Expand/collapse */}
                        {steps.length > PREVIEW_COUNT && (
                            <Button
                                variant="outline"
                                className="w-full gap-2"
                                onClick={() => setExpanded(!expanded)}
                            >
                                {expanded ? (
                                    <><ChevronUp className="w-4 h-4" /> Show less</>
                                ) : (
                                    <><ChevronDown className="w-4 h-4" /> Show {remaining} more steps</>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button onClick={() => navigate('/cost', { state: { steps, input } })} className="gap-2">
                            Next: Get cost estimate
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/plan')} className="gap-2">
                            <RotateCcw className="w-4 h-4" />
                            Start over
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    )
}
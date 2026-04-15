import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Paperclip, SendHorizonal } from 'lucide-react'

const EXAMPLES = [
  'Retile my 12 x 9.5 ft bathroom floor...',
  'Build a 12 x 16 deck in my backyard...',
  'Help me repaint my living room...',
]

export default function DescribeProject() {
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (!text.trim()) return
    // TODO: send to AI / navigate to next step
    console.log('Project:', text)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl font-bold">Describe Your Project</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Tell us what you want to build or improve — in plain English. Include dimensions if you know them.
          </p>
        </div>

        {/* Textarea card */}
        <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder='e.g. "Retile my 12 x 9.5 ft bathroom floor and walls up to 8 ft — white matte ceramic, bright white grout, I already have a drill"'
            className="min-h-36 resize-none border-none shadow-none focus-visible:ring-0 p-3 text-base bg-white"
          />
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon">
              <Paperclip className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{text.length} chars</span>
              <Button size="icon" onClick={handleSubmit} disabled={!text.trim()}>
                <SendHorizonal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Examples */}
        <div className="space-y-3">
          <p className="font-semibold text-sm">Try an Example</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map(ex => (
              <Button
                key={ex}
                variant="default"
                className="text-sm"
                onClick={() => setText(ex)}
              >
                {ex}
              </Button>
            ))}
          </div>
        </div>

      </div>

      {/* Disclaimer */}
      <p className="mt-54  text-xs text-muted-foreground text-center">
        Powered by AI. Responses may be inaccurate. Confirm details before proceeding.
      </p>
    </div>
  )
}
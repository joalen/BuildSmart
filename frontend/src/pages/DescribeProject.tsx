import { useState } from 'react'
import './DescribeProject.css'

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
    <div className="describe-page">
      <div className="describe-card">
        <div className="describe-header">
          <h1>Describe Your Project</h1>
          <span className="badge">FR-1</span>
        </div>
        <p className="describe-subtitle">
          Tell us what you want to build or improve — in plain English. Include dimensions if you know them.
        </p>

        <div className="textarea-wrapper">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder='e.g. "Retile my 12×9.5 ft bathroom floor and walls up to 8 ft — white matte ceramic, bright white grout, I already have a drill'
          />
          <div className="textarea-footer">
            <button className="attach-btn">+</button>
            <span className="char-count">{text.length} chars</span>
            <button className="submit-btn" onClick={handleSubmit}>➤</button>
          </div>
        </div>

        <div className="examples">
          <strong>Try an Example</strong>
          <div className="example-chips">
            {EXAMPLES.map(ex => (
              <button key={ex} className="chip" onClick={() => setText(ex)}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="ai-disclaimer">
        Powered by AI. Responses may be inaccurate. Confirm details before proceeding.
      </p>
    </div>
  )
}
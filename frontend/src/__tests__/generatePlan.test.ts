import { describe, it, expect } from 'vitest'

const SUBREDDITS = ['DIY', 'HomeImprovement', 'handyman']

const results = await Promise.all(
  SUBREDDITS.map(sub =>
    fetch(`https://www.reddit.com/r/${sub}/top.json?limit=100&t=year`, {
      headers: { 'User-Agent': 'vitest-test-runner' }
    }).then(r => r.json())
  )
)

const TEST_INPUTS: string[] = results
  .flatMap(data => data.data.children.map((post: any) => post.data.title))
  .filter((title: string) =>
    title.length < 120 &&
    /\b(build|install|fix|repair|replace|paint|tile|floor|deck|fence|wall|ceiling|door|window|plumb|wire|hang|mount|renovate|remodel)\b/i.test(title)
  )
  .slice(0, 3)

describe('POST /generate-plan', () => {
  it.each(TEST_INPUTS)('generates a valid plan for: %s', async (input) => {
    const res = await fetch('http://localhost:8000/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    })

    expect(res.ok).toBe(true)
    const data = await res.json()

    expect(data.overview).toBeTypeOf('string')
    expect(data.materials.length).toBeGreaterThan(0)
    expect(data.tools.length).toBeGreaterThan(0)
    expect(data.steps.length).toBeGreaterThan(0)
  }, 60000)
})
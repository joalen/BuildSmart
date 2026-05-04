import { describe, it, expect, beforeAll, vi } from 'vitest'

const FALLBACK_INPUTS = [
  'How do I install a ceiling fan?',
  'Best way to tile a bathroom floor',
  'How to fix a leaky faucet'
]

let TEST_INPUTS: string[] = []

beforeAll(async () => {
  const SUBREDDITS = ['DIY', 'HomeImprovement', 'handyman']
  try {
    const results = await Promise.all(
      SUBREDDITS.map(sub =>
        fetch(`https://www.reddit.com/r/${sub}/top.json?limit=100&t=year`, {
          headers: { 'User-Agent': 'vitest-test-runner' }
        }).then(r => r.json())
      )
    )
    TEST_INPUTS = results
      .flatMap(data => data.data.children.map((post: any) => post.data.title))
      .filter((title: string) =>
        title.length < 120 &&
        /\b(build|install|fix|repair|replace|paint|tile|floor|deck|fence|wall|ceiling|door|window|plumb|wire|hang|mount|renovate|remodel)\b/i.test(title)
      )
      .slice(0, 1)
  } catch {
    TEST_INPUTS = FALLBACK_INPUTS.slice(0, 1)
  }
})

describe('POST /generate-plan', () => {
  it('generates a valid plan', async () => {
    const input = TEST_INPUTS[0]
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

    data.steps.forEach((step: any, i: number) => {
      expect(step.order ?? i).toBe(i)
      expect(step.description).toBeTypeOf('string')
      expect(step.description.length).toBeGreaterThan(0)
    })

    const isSafetyTask = /electric|wire|outlet|gas|plumb/i.test(input)
    if (isSafetyTask) {
      const allText = JSON.stringify(data).toLowerCase()
      expect(/safety|shutoff|breaker|turn off|protective|gloves|goggles|ventilat/i.test(allText)).toBe(true)
    }

    const materialIds: string[] = data.materials.map((m: any) => m.itemId).filter(Boolean)
    if (materialIds.length > 0) {
      const stepText = data.steps.map((s: any) => JSON.stringify(s)).join(' ')
      expect(materialIds.some(id => stepText.includes(id))).toBe(true)
    }
  }, 60000)
})
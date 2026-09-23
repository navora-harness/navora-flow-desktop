import { describe, expect, it } from 'vitest'
import { runDemoGraph } from '../shared/demo-flow.js'

describe('demo flow', () => {
  it('produces Navora Flow', async () => {
    const result = await runDemoGraph()
    expect(result.ok).toBe(true)
    expect(result.exitOutputs?.value).toBe('Navora Flow')
    expect(result.snapshots.length).toBeGreaterThan(0)
  })
})

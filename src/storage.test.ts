import { beforeEach, describe, expect, test } from 'vitest'
import { channelDep, emptyPlan, newContact, newCriticalItem, newMeetingPoint, personDep, type Plan } from './model'
import { isPlanShaped, loadPlan, savePlan, clearPlan, SCHEMA_VERSION, STORAGE_KEY } from './storage'

function samplePlan(): Plan {
  const mom = newContact({ name: 'Mom', phone: '555-0100', memorized: true })
  const school = newMeetingPoint({ label: 'School gate', address: '12 Elm St' })
  const meds = newCriticalItem({
    name: 'Insulin schedule',
    category: 'medication',
    dependencies: [channelDep('power'), personDep(mom.id)],
  })
  return { contacts: [mom], meetingPoints: [school], items: [meds] }
}

beforeEach(() => {
  localStorage.clear()
})

describe('savePlan / loadPlan round trip', () => {
  test('empty storage loads as an empty plan', () => {
    const result = loadPlan()
    expect(result.status).toBe('empty')
    expect(result.plan).toEqual(emptyPlan())
  })

  test('a saved plan loads back identically', () => {
    const plan = samplePlan()
    expect(savePlan(plan)).toBe(true)
    const result = loadPlan()
    expect(result.status).toBe('loaded')
    expect(result.plan).toEqual(plan)
    expect('migratedFrom' in result && result.migratedFrom).toBeFalsy()
  })

  test('plans are stored under a versioned envelope', () => {
    savePlan(samplePlan())
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.version).toBe(SCHEMA_VERSION)
    expect(stored.plan.contacts).toHaveLength(1)
  })

  test('clearPlan removes the stored plan', () => {
    savePlan(samplePlan())
    clearPlan()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(loadPlan().status).toBe('empty')
  })

  test('savePlan reports failure when storage throws instead of raising', () => {
    const broken = {
      setItem() {
        throw new DOMException('quota', 'QuotaExceededError')
      },
    } as unknown as Storage
    expect(savePlan(samplePlan(), broken)).toBe(false)
  })
})

describe('corrupt or foreign data', () => {
  test.each([
    ['not JSON at all', '{oops'],
    ['a JSON scalar', '42'],
    ['an array', '[1,2,3]'],
    ['an object that is not a plan', '{"hello":"world"}'],
    ['an envelope holding a non-plan', `{"version":${SCHEMA_VERSION},"plan":{"contacts":"nope"}}`],
  ])('rejects %s and falls back to an empty plan', (_label, raw) => {
    localStorage.setItem(STORAGE_KEY, raw)
    const result = loadPlan()
    expect(result.status).toBe('rejected')
    expect(result.plan).toEqual(emptyPlan())
    // The unreadable value is left in place, not destroyed.
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
  })

  test('rejects a plan whose items have malformed dependencies', () => {
    const plan = samplePlan()
    ;(plan.items[0].dependencies as unknown[]).push({ kind: 'channel', channel: 'fax' })
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, plan }))
    expect(loadPlan().status).toBe('rejected')
  })
})

describe('migration guard', () => {
  test('refuses envelopes from a newer schema version, keeping the data intact', () => {
    const raw = JSON.stringify({ version: SCHEMA_VERSION + 1, plan: samplePlan() })
    localStorage.setItem(STORAGE_KEY, raw)
    const result = loadPlan()
    expect(result.status).toBe('rejected')
    expect(result.status === 'rejected' && result.reason).toMatch(/newer/)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
  })

  test('migrates a bare pre-envelope plan (version 0) forward', () => {
    const plan = samplePlan()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
    const result = loadPlan()
    expect(result.status).toBe('loaded')
    expect(result.plan).toEqual(plan)
    expect(result.status === 'loaded' && result.migratedFrom).toBe(0)
  })

  test('re-saving a migrated plan upgrades the stored envelope', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(samplePlan()))
    const result = loadPlan()
    savePlan(result.plan)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.version).toBe(SCHEMA_VERSION)
  })
})

describe('isPlanShaped', () => {
  test('accepts empty and sample plans', () => {
    expect(isPlanShaped(emptyPlan())).toBe(true)
    expect(isPlanShaped(samplePlan())).toBe(true)
  })

  test('rejects missing collections, bad field types, and non-objects', () => {
    expect(isPlanShaped(null)).toBe(false)
    expect(isPlanShaped({ contacts: [], meetingPoints: [] })).toBe(false)
    expect(isPlanShaped({ contacts: [{ id: 1 }], meetingPoints: [], items: [] })).toBe(false)
    const plan = samplePlan()
    ;(plan.contacts[0] as unknown as Record<string, unknown>).memorized = 'yes'
    expect(isPlanShaped(plan)).toBe(false)
  })
})

import { describe, expect, test } from 'vitest'
import {
  CHANNELS,
  channelDep,
  emptyPlan,
  isChannel,
  newContact,
  newCriticalItem,
  newMeetingPoint,
  personDep,
  sameDependency,
  validatePlan,
  type Plan,
} from './model'

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

describe('channels and dependencies', () => {
  test('isChannel accepts the three channels and rejects everything else', () => {
    for (const channel of CHANNELS) expect(isChannel(channel)).toBe(true)
    expect(isChannel('carrier-pigeon')).toBe(false)
    expect(isChannel(undefined)).toBe(false)
  })

  test('sameDependency matches by channel or contact, never across kinds', () => {
    expect(sameDependency(channelDep('phone'), channelDep('phone'))).toBe(true)
    expect(sameDependency(channelDep('phone'), channelDep('power'))).toBe(false)
    expect(sameDependency(personDep('a'), personDep('a'))).toBe(true)
    expect(sameDependency(personDep('a'), personDep('b'))).toBe(false)
    expect(sameDependency(channelDep('phone'), personDep('phone'))).toBe(false)
  })
})

describe('factories', () => {
  test('generate unique ids', () => {
    const ids = [newContact().id, newContact().id, newMeetingPoint().id, newCriticalItem().id]
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('apply overrides on top of defaults', () => {
    const item = newCriticalItem({ name: 'Passports', category: 'document' })
    expect(item.name).toBe('Passports')
    expect(item.category).toBe('document')
    expect(item.dependencies).toEqual([])
  })

  test('default to not essential, overridable', () => {
    expect(newContact().essential).toBe(false)
    expect(newMeetingPoint().essential).toBe(false)
    expect(newCriticalItem().essential).toBe(false)
    expect(newContact({ essential: true }).essential).toBe(true)
  })
})

describe('validatePlan', () => {
  test('accepts an empty plan and a well-formed sample plan', () => {
    expect(validatePlan(emptyPlan())).toEqual([])
    expect(validatePlan(samplePlan())).toEqual([])
  })

  test('flags blank names and labels', () => {
    const plan: Plan = {
      contacts: [newContact({ name: '  ' })],
      meetingPoints: [newMeetingPoint({ label: '' })],
      items: [newCriticalItem({ name: '' })],
    }
    const paths = validatePlan(plan).map((issue) => issue.path)
    expect(paths).toContain('contacts[0].name')
    expect(paths).toContain('meetingPoints[0].label')
    expect(paths).toContain('items[0].name')
  })

  test('flags blank and duplicate ids across all collections', () => {
    const plan = samplePlan()
    plan.contacts[0].id = ''
    plan.items[0].id = plan.meetingPoints[0].id
    const issues = validatePlan(plan)
    expect(issues.some((i) => i.path === 'contacts[0].id' && /blank/.test(i.message))).toBe(true)
    expect(issues.some((i) => i.path === 'items[0].id' && /duplicate/.test(i.message))).toBe(true)
  })

  test('flags person dependencies that reference a missing contact', () => {
    const plan = samplePlan()
    plan.items[0].dependencies.push(personDep('ghost'))
    const issues = validatePlan(plan)
    expect(issues).toHaveLength(1)
    expect(issues[0].path).toBe('items[0].dependencies[2]')
    expect(issues[0].message).toMatch(/missing contact "ghost"/)
  })

  test('removing a contact invalidates items that still depend on them', () => {
    const plan = samplePlan()
    plan.contacts = []
    const issues = validatePlan(plan)
    expect(issues.some((i) => /missing contact/.test(i.message))).toBe(true)
  })

  test('flags duplicate dependencies on one item, only at the repeat', () => {
    const plan = samplePlan()
    plan.items[0].dependencies.push(channelDep('power'))
    const issues = validatePlan(plan)
    expect(issues).toHaveLength(1)
    expect(issues[0].path).toBe('items[0].dependencies[2]')
    expect(issues[0].message).toBe('duplicate dependency')
  })

  test('flags unknown channels and categories from untrusted data', () => {
    const plan = samplePlan()
    plan.items[0].category = 'snacks' as never
    plan.items[0].dependencies.push({ kind: 'channel', channel: 'fax' as never })
    const paths = validatePlan(plan).map((issue) => issue.path)
    expect(paths).toContain('items[0].category')
    expect(paths).toContain('items[0].dependencies[2]')
  })
})

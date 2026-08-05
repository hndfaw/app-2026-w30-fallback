import { describe, expect, test } from 'vitest'
import { samplePlan } from './samplePlan'
import { validatePlan } from './model'

describe('samplePlan', () => {
  test('is a valid plan', () => {
    expect(validatePlan(samplePlan())).toEqual([])
  })

  test('has at least one contact, meeting point, and item', () => {
    const plan = samplePlan()
    expect(plan.contacts.length).toBeGreaterThan(0)
    expect(plan.meetingPoints.length).toBeGreaterThan(0)
    expect(plan.items.length).toBeGreaterThan(0)
  })

  test('person dependencies reference a contact that exists in the plan', () => {
    const plan = samplePlan()
    const contactIds = new Set(plan.contacts.map((c) => c.id))
    for (const item of plan.items) {
      for (const dep of item.dependencies) {
        if (dep.kind === 'person') {
          expect(contactIds.has(dep.contactId)).toBe(true)
        }
      }
    }
  })

  test('returns fresh ids on each call', () => {
    const a = samplePlan()
    const b = samplePlan()
    expect(a.contacts[0].id).not.toBe(b.contacts[0].id)
  })
})

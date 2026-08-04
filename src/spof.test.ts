import { describe, expect, test } from 'vitest'
import { channelDep, newContact, newCriticalItem, newMeetingPoint, personDep, type Plan } from './model'
import { dependencyLabel, singlePointsOfFailure, spofsByDependency } from './spof'

// Mom is the only one who knows the med schedule; the radio needs power alone;
// the safe needs both power and internet (redundant-ish, not a single point);
// passports need nothing. The neighbor's spare-key pickup depends on Mom too.
function samplePlan() {
  const mom = newContact({ name: 'Mom', phone: '555-0100', memorized: true })
  const neighbor = newContact({ name: 'Neighbor', phone: '555-0199' })
  const radio = newCriticalItem({
    name: 'Emergency radio',
    dependencies: [channelDep('power')],
  })
  const meds = newCriticalItem({
    name: 'Insulin schedule',
    category: 'medication',
    dependencies: [personDep(mom.id)],
  })
  const keyPickup = newCriticalItem({
    name: 'Spare key pickup',
    dependencies: [personDep(mom.id)],
  })
  const safe = newCriticalItem({
    name: 'Fireproof safe',
    dependencies: [channelDep('power'), channelDep('internet')],
  })
  const passports = newCriticalItem({ name: 'Passports', category: 'document' })
  const plan: Plan = {
    contacts: [mom, neighbor],
    meetingPoints: [newMeetingPoint({ label: 'School gate', address: '12 Elm St' })],
    items: [radio, meds, keyPickup, safe, passports],
  }
  return { plan, mom, neighbor, radio, meds, keyPickup, safe, passports }
}

describe('singlePointsOfFailure', () => {
  test('flags only items with exactly one dependency', () => {
    const { plan, radio, meds, keyPickup } = samplePlan()
    const spofs = singlePointsOfFailure(plan)
    expect(spofs.map((s) => s.item.id)).toEqual([radio.id, meds.id, keyPickup.id])
  })

  test('pairs each flagged item with its single dependency', () => {
    const { plan, mom, radio, meds } = samplePlan()
    const spofs = singlePointsOfFailure(plan)
    expect(spofs.find((s) => s.item.id === radio.id)?.dependency).toEqual(channelDep('power'))
    expect(spofs.find((s) => s.item.id === meds.id)?.dependency).toEqual(personDep(mom.id))
  })

  test('empty plan and dependency-free items produce no spofs', () => {
    const plan: Plan = { contacts: [], meetingPoints: [], items: [] }
    expect(singlePointsOfFailure(plan)).toEqual([])

    const onlyMultiDep: Plan = {
      contacts: [],
      meetingPoints: [],
      items: [newCriticalItem({ name: 'Safe', dependencies: [channelDep('power'), channelDep('internet')] })],
    }
    expect(singlePointsOfFailure(onlyMultiDep)).toEqual([])
  })
})

describe('spofsByDependency', () => {
  test('groups spofs by dependency, most items first', () => {
    const { plan, mom, radio, meds, keyPickup } = samplePlan()
    const groups = spofsByDependency(plan)
    expect(groups).toHaveLength(2)
    expect(groups[0].dependency).toEqual(personDep(mom.id))
    expect(groups[0].items.map((i) => i.id).sort()).toEqual([keyPickup.id, meds.id].sort())
    expect(groups[1].dependency).toEqual(channelDep('power'))
    expect(groups[1].items.map((i) => i.id)).toEqual([radio.id])
  })

  test('returns nothing when no item has exactly one dependency', () => {
    const plan: Plan = {
      contacts: [],
      meetingPoints: [],
      items: [newCriticalItem({ name: 'Passports' })],
    }
    expect(spofsByDependency(plan)).toEqual([])
  })
})

describe('dependencyLabel', () => {
  test('labels a channel dependency with the channel name', () => {
    const { plan } = samplePlan()
    expect(dependencyLabel(channelDep('power'), plan)).toBe('power')
  })

  test('labels a person dependency with the contact name', () => {
    const { plan, mom } = samplePlan()
    expect(dependencyLabel(personDep(mom.id), plan)).toBe('Mom')
  })

  test('falls back to "Unknown person" for a missing contact', () => {
    const { plan } = samplePlan()
    expect(dependencyLabel(personDep('gone'), plan)).toBe('Unknown person')
  })
})

import { describe, expect, test } from 'vitest'
import {
  channelDep,
  newContact,
  newCriticalItem,
  newMeetingPoint,
  personDep,
  type Plan,
} from './model'
import {
  allScenarios,
  channelLoss,
  contactAvailable,
  personLoss,
  runScenario,
  scenarioLabel,
  stressTest,
  survivingPlan,
} from './stress'

// Mom is memorized; the neighbor's number lives only in a phone. The radio
// needs power, the med schedule needs power and Mom, the passports need nothing.
function samplePlan() {
  const mom = newContact({ name: 'Mom', phone: '555-0100', memorized: true })
  const neighbor = newContact({ name: 'Neighbor', phone: '555-0199', memorized: false })
  const radio = newCriticalItem({
    name: 'Emergency radio',
    category: 'other',
    dependencies: [channelDep('power')],
  })
  const meds = newCriticalItem({
    name: 'Insulin schedule',
    category: 'medication',
    dependencies: [channelDep('power'), personDep(mom.id)],
  })
  const passports = newCriticalItem({ name: 'Passports', category: 'document' })
  const plan: Plan = {
    contacts: [mom, neighbor],
    meetingPoints: [newMeetingPoint({ label: 'School gate', address: '12 Elm St' })],
    items: [radio, meds, passports],
  }
  return { plan, mom, neighbor, radio, meds, passports }
}

describe('scenarioLabel', () => {
  test('names channels and people', () => {
    const { plan, mom } = samplePlan()
    expect(scenarioLabel(channelLoss('power'), plan)).toBe('Loss of power')
    expect(scenarioLabel(personLoss(mom.id), plan)).toBe('Mom unavailable')
    expect(scenarioLabel(personLoss('nope'), plan)).toBe('Unknown person unavailable')
  })
})

describe('contactAvailable', () => {
  test('phone loss keeps only memorized contacts reachable', () => {
    const { mom, neighbor } = samplePlan()
    expect(contactAvailable(mom, channelLoss('phone'))).toBe(true)
    expect(contactAvailable(neighbor, channelLoss('phone'))).toBe(false)
  })

  test('power and internet loss do not remove people', () => {
    const { neighbor } = samplePlan()
    expect(contactAvailable(neighbor, channelLoss('power'))).toBe(true)
    expect(contactAvailable(neighbor, channelLoss('internet'))).toBe(true)
  })

  test('person loss removes exactly that person', () => {
    const { mom, neighbor } = samplePlan()
    expect(contactAvailable(mom, personLoss(mom.id))).toBe(false)
    expect(contactAvailable(neighbor, personLoss(mom.id))).toBe(true)
  })
})

describe('runScenario', () => {
  test('power loss breaks power-dependent items and lists the broken deps', () => {
    const { plan, radio, meds, passports } = samplePlan()
    const result = runScenario(plan, channelLoss('power'))
    const byId = new Map(result.items.map((o) => [o.item.id, o]))
    expect(byId.get(radio.id)?.ok).toBe(false)
    expect(byId.get(radio.id)?.broken).toEqual([channelDep('power')])
    expect(byId.get(meds.id)?.ok).toBe(false)
    expect(byId.get(meds.id)?.broken).toEqual([channelDep('power')])
    expect(byId.get(passports.id)?.ok).toBe(true)
    expect(result.pass).toBe(false)
    expect(result.gaps).toHaveLength(2)
  })

  test('phone loss flags non-memorized contacts as gaps and breaks their person deps', () => {
    const { plan, neighbor, mom } = samplePlan()
    plan.items.push(
      newCriticalItem({ name: 'Spare key pickup', dependencies: [personDep(neighbor.id)] }),
    )
    const result = runScenario(plan, channelLoss('phone'))
    expect(result.contacts.find((o) => o.contact.id === mom.id)?.reachable).toBe(true)
    expect(result.contacts.find((o) => o.contact.id === neighbor.id)?.reachable).toBe(false)
    const contactGaps = result.gaps.filter((g) => g.kind === 'contact')
    expect(contactGaps).toHaveLength(1)
    const itemGaps = result.gaps.filter((g) => g.kind === 'item')
    expect(itemGaps).toHaveLength(1)
    expect(result.pass).toBe(false)
  })

  test('losing a person breaks their items but their own absence is not a gap', () => {
    const { plan, mom, meds } = samplePlan()
    const result = runScenario(plan, personLoss(mom.id))
    const medsOutcome = result.items.find((o) => o.item.id === meds.id)
    expect(medsOutcome?.ok).toBe(false)
    expect(medsOutcome?.broken).toEqual([personDep(mom.id)])
    expect(result.gaps).toEqual([{ kind: 'item', item: meds, broken: [personDep(mom.id)] }])
    expect(result.pass).toBe(false)
  })

  test('internet loss passes for a plan with no internet dependencies', () => {
    const { plan } = samplePlan()
    const result = runScenario(plan, channelLoss('internet'))
    expect(result.gaps).toEqual([])
    expect(result.pass).toBe(true)
  })

  test('a person dependency on a missing contact is always broken', () => {
    const { plan } = samplePlan()
    plan.items.push(newCriticalItem({ name: 'Ghost task', dependencies: [personDep('gone')] }))
    const result = runScenario(plan, channelLoss('internet'))
    expect(result.pass).toBe(false)
    expect(result.gaps).toHaveLength(1)
  })
})

describe('allScenarios / stressTest', () => {
  test('enumerates each channel plus each contact', () => {
    const { plan, mom, neighbor } = samplePlan()
    const scenarios = allScenarios(plan)
    expect(scenarios).toHaveLength(5)
    expect(scenarios.filter((s) => s.kind === 'channel')).toHaveLength(3)
    expect(scenarios.filter((s) => s.kind === 'person').map((s) => s.contactId)).toEqual([
      mom.id,
      neighbor.id,
    ])
  })

  test('stressTest runs every scenario', () => {
    const { plan } = samplePlan()
    const results = stressTest(plan)
    expect(results).toHaveLength(5)
    expect(results.map((r) => r.scenario)).toEqual(allScenarios(plan))
  })
})

describe('survivingPlan', () => {
  test('keeps reachable contacts, working items, and all meeting points', () => {
    const { plan, mom, passports } = samplePlan()
    const survived = survivingPlan(plan, channelLoss('phone'))
    expect(survived.contacts.map((c) => c.id)).toEqual([mom.id])
    expect(survived.items.map((i) => i.id)).toEqual(plan.items.map((i) => i.id))
    expect(survived.meetingPoints).toEqual(plan.meetingPoints)

    const afterPower = survivingPlan(plan, channelLoss('power'))
    expect(afterPower.items.map((i) => i.id)).toEqual([passports.id])
    expect(afterPower.contacts).toHaveLength(2)
  })
})

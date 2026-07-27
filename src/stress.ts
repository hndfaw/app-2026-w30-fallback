// Stress-test engine (ticket 5).
//
// A scenario knocks out one thing — a shared channel (phone/power/internet) or
// one specific person. Running a scenario against a plan answers: which
// contacts are still reachable, which critical items still work, and what
// exactly broke. The scenario results UI (ticket 9) renders these directly.

import {
  CHANNELS,
  type Channel,
  type Contact,
  type CriticalItem,
  type Dependency,
  type Plan,
} from './model'

export type Scenario =
  | { kind: 'channel'; channel: Channel }
  | { kind: 'person'; contactId: string }

export function channelLoss(channel: Channel): Scenario {
  return { kind: 'channel', channel }
}

export function personLoss(contactId: string): Scenario {
  return { kind: 'person', contactId }
}

/** Human label, e.g. "Loss of power" or "Mom unavailable". */
export function scenarioLabel(scenario: Scenario, plan: Plan): string {
  if (scenario.kind === 'channel') return `Loss of ${scenario.channel}`
  const contact = plan.contacts.find((c) => c.id === scenario.contactId)
  return `${contact?.name.trim() || 'Unknown person'} unavailable`
}

/**
 * Whether a contact can still be reached under a scenario. Losing the person
 * removes them outright; losing phone removes every contact whose number is
 * not memorized or written down offline. Power/internet loss does not by
 * itself make a person unreachable.
 */
export function contactAvailable(contact: Contact, scenario: Scenario): boolean {
  if (scenario.kind === 'person') return contact.id !== scenario.contactId
  if (scenario.channel === 'phone') return contact.memorized
  return true
}

/**
 * Whether a single dependency is knocked out by a scenario. A person
 * dependency on a contact that does not exist in the plan is always broken —
 * validation flags it, but the engine must not count it as surviving.
 */
export function dependencyBroken(
  dep: Dependency,
  scenario: Scenario,
  contactsById: Map<string, Contact>,
): boolean {
  if (dep.kind === 'channel') {
    return scenario.kind === 'channel' && scenario.channel === dep.channel
  }
  const contact = contactsById.get(dep.contactId)
  return !contact || !contactAvailable(contact, scenario)
}

export interface ContactOutcome {
  contact: Contact
  reachable: boolean
}

export interface ItemOutcome {
  item: CriticalItem
  ok: boolean
  /** The dependencies the scenario knocked out (empty when ok). */
  broken: Dependency[]
}

/** A concrete problem the scenario exposed. */
export type Gap =
  | { kind: 'item'; item: CriticalItem; broken: Dependency[] }
  | { kind: 'contact'; contact: Contact }

export interface ScenarioResult {
  scenario: Scenario
  contacts: ContactOutcome[]
  items: ItemOutcome[]
  gaps: Gap[]
  pass: boolean
}

/**
 * Run one scenario. A gap is a critical item with a broken dependency, or a
 * contact who became unreachable — except the lost person themself in a
 * person-loss scenario, whose absence is the premise, not a finding.
 */
export function runScenario(plan: Plan, scenario: Scenario): ScenarioResult {
  const contactsById = new Map(plan.contacts.map((c) => [c.id, c]))

  const contacts: ContactOutcome[] = plan.contacts.map((contact) => ({
    contact,
    reachable: contactAvailable(contact, scenario),
  }))

  const items: ItemOutcome[] = plan.items.map((item) => {
    const broken = item.dependencies.filter((dep) =>
      dependencyBroken(dep, scenario, contactsById),
    )
    return { item, ok: broken.length === 0, broken }
  })

  const gaps: Gap[] = [
    ...items
      .filter((outcome) => !outcome.ok)
      .map((outcome): Gap => ({ kind: 'item', item: outcome.item, broken: outcome.broken })),
    ...contacts
      .filter(
        (outcome) =>
          !outcome.reachable &&
          !(scenario.kind === 'person' && outcome.contact.id === scenario.contactId),
      )
      .map((outcome): Gap => ({ kind: 'contact', contact: outcome.contact })),
  ]

  return { scenario, contacts, items, gaps, pass: gaps.length === 0 }
}

/** Every scenario worth testing: each channel loss plus each contact's loss. */
export function allScenarios(plan: Plan): Scenario[] {
  return [
    ...CHANNELS.map(channelLoss),
    ...plan.contacts.map((contact) => personLoss(contact.id)),
  ]
}

/** Run the full suite of scenarios against a plan. */
export function stressTest(plan: Plan): ScenarioResult[] {
  return allScenarios(plan).map((scenario) => runScenario(plan, scenario))
}

/**
 * The plan that remains usable under a scenario: reachable contacts, working
 * items, and all meeting points (physical places survive any channel loss).
 */
export function survivingPlan(plan: Plan, scenario: Scenario): Plan {
  const result = runScenario(plan, scenario)
  return {
    contacts: result.contacts.filter((o) => o.reachable).map((o) => o.contact),
    meetingPoints: plan.meetingPoints,
    items: result.items.filter((o) => o.ok).map((o) => o.item),
  }
}

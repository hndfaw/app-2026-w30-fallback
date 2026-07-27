// Core data model for a household fallback plan.
//
// A plan is three lists: people to reach, places to meet, and critical items
// (meds, documents, utility shutoffs). Every critical item carries dependency
// tags — the channels or specific people it stops working without. The
// stress-test engine and SPOF analyzer (tickets 5–6) operate on these tags.

export const CHANNELS = ['phone', 'power', 'internet'] as const
export type Channel = (typeof CHANNELS)[number]

export function isChannel(value: unknown): value is Channel {
  return typeof value === 'string' && (CHANNELS as readonly string[]).includes(value)
}

/** What a critical item depends on: a shared channel, or one specific person. */
export type Dependency =
  | { kind: 'channel'; channel: Channel }
  | { kind: 'person'; contactId: string }

export function channelDep(channel: Channel): Dependency {
  return { kind: 'channel', channel }
}

export function personDep(contactId: string): Dependency {
  return { kind: 'person', contactId }
}

export function sameDependency(a: Dependency, b: Dependency): boolean {
  if (a.kind === 'channel' && b.kind === 'channel') return a.channel === b.channel
  if (a.kind === 'person' && b.kind === 'person') return a.contactId === b.contactId
  return false
}

export interface Contact {
  id: string
  name: string
  phone: string
  /** True when the number survives phone loss: memorized or written down offline. */
  memorized: boolean
  notes: string
}

export interface MeetingPoint {
  id: string
  label: string
  address: string
  notes: string
}

export const ITEM_CATEGORIES = ['medication', 'document', 'utility', 'other'] as const
export type ItemCategory = (typeof ITEM_CATEGORIES)[number]

export interface CriticalItem {
  id: string
  name: string
  category: ItemCategory
  dependencies: Dependency[]
  notes: string
}

export interface Plan {
  contacts: Contact[]
  meetingPoints: MeetingPoint[]
  items: CriticalItem[]
}

export function createId(): string {
  return crypto.randomUUID()
}

export function emptyPlan(): Plan {
  return { contacts: [], meetingPoints: [], items: [] }
}

export function newContact(init: Partial<Omit<Contact, 'id'>> = {}): Contact {
  return { id: createId(), name: '', phone: '', memorized: false, notes: '', ...init }
}

export function newMeetingPoint(init: Partial<Omit<MeetingPoint, 'id'>> = {}): MeetingPoint {
  return { id: createId(), label: '', address: '', notes: '', ...init }
}

export function newCriticalItem(init: Partial<Omit<CriticalItem, 'id'>> = {}): CriticalItem {
  return { id: createId(), name: '', category: 'other', dependencies: [], notes: '', ...init }
}

export interface ValidationIssue {
  /** Where the problem is, e.g. `contacts[1].name` or `items[0].dependencies`. */
  path: string
  message: string
}

/** Returns every problem that would make the plan unsafe to run or persist. */
export function validatePlan(plan: Plan): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seenIds = new Map<string, string>()

  const checkId = (id: string, path: string) => {
    if (!id.trim()) {
      issues.push({ path, message: 'id must not be blank' })
      return
    }
    const firstPath = seenIds.get(id)
    if (firstPath) {
      issues.push({ path, message: `duplicate id "${id}" (also used at ${firstPath})` })
    } else {
      seenIds.set(id, path)
    }
  }

  plan.contacts.forEach((contact, i) => {
    const path = `contacts[${i}]`
    checkId(contact.id, `${path}.id`)
    if (!contact.name.trim()) {
      issues.push({ path: `${path}.name`, message: 'contact name must not be blank' })
    }
  })

  plan.meetingPoints.forEach((point, i) => {
    const path = `meetingPoints[${i}]`
    checkId(point.id, `${path}.id`)
    if (!point.label.trim()) {
      issues.push({ path: `${path}.label`, message: 'meeting point label must not be blank' })
    }
  })

  const contactIds = new Set(plan.contacts.map((c) => c.id))
  plan.items.forEach((item, i) => {
    const path = `items[${i}]`
    checkId(item.id, `${path}.id`)
    if (!item.name.trim()) {
      issues.push({ path: `${path}.name`, message: 'item name must not be blank' })
    }
    if (!(ITEM_CATEGORIES as readonly string[]).includes(item.category)) {
      issues.push({ path: `${path}.category`, message: `unknown category "${item.category}"` })
    }
    item.dependencies.forEach((dep, j) => {
      const depPath = `${path}.dependencies[${j}]`
      if (dep.kind === 'channel' && !isChannel(dep.channel)) {
        issues.push({ path: depPath, message: `unknown channel "${dep.channel}"` })
      }
      if (dep.kind === 'person' && !contactIds.has(dep.contactId)) {
        issues.push({
          path: depPath,
          message: `person dependency references missing contact "${dep.contactId}"`,
        })
      }
      const dupIndex = item.dependencies.findIndex((other) => sameDependency(dep, other))
      if (dupIndex < j) {
        issues.push({ path: depPath, message: 'duplicate dependency' })
      }
    })
  })

  return issues
}

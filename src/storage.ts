// localStorage persistence for the fallback plan.
//
// Plans are stored under one key as a versioned envelope `{ version, plan }`.
// Loading never throws and never destroys data it can't understand: corrupt
// JSON, unknown shapes, and envelopes written by a *newer* schema are left
// in place and reported, with an empty plan returned as the working fallback.
// Envelopes from *older* schemas are migrated forward step by step.

import { emptyPlan, isChannel, type Dependency, type Plan } from './model'

export const STORAGE_KEY = 'fallback-plan'
export const SCHEMA_VERSION = 2

interface Envelope {
  version: number
  plan: Plan
}

export type LoadResult =
  /** Nothing stored yet — `plan` is a fresh empty plan. */
  | { status: 'empty'; plan: Plan }
  /** Stored plan loaded; `migratedFrom` is set when an older schema was upgraded. */
  | { status: 'loaded'; plan: Plan; migratedFrom?: number }
  /** Stored value unusable — `plan` is a fresh empty plan, the stored value is untouched. */
  | { status: 'rejected'; plan: Plan; reason: string }

/**
 * Migrations keyed by the version they upgrade FROM. Version 0 is the
 * pre-envelope era: a bare plan object stored without `{ version, plan }`.
 * Each new schema version adds a `SCHEMA_VERSION - 1` entry here.
 */
const MIGRATIONS: Record<number, (data: unknown) => unknown> = {
  0: (data) => data,
  // v1 plans predate the "essential" flag (ticket 10) — default every entry to not essential.
  1: (data) => {
    if (!isRecord(data)) return data
    const addEssential = (list: unknown) =>
      Array.isArray(list)
        ? list.map((entry) => (isRecord(entry) ? { essential: false, ...entry } : entry))
        : list
    return {
      ...data,
      contacts: addEssential(data.contacts),
      meetingPoints: addEssential(data.meetingPoints),
      items: addEssential(data.items),
    }
  },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isDependency(value: unknown): value is Dependency {
  if (!isRecord(value)) return false
  if (value.kind === 'channel') return isChannel(value.channel)
  if (value.kind === 'person') return typeof value.contactId === 'string'
  return false
}

function hasStringFields(value: Record<string, unknown>, fields: string[]): boolean {
  return fields.every((field) => typeof value[field] === 'string')
}

/** Structural check only — semantic problems are validatePlan's job. */
export function isPlanShaped(value: unknown): value is Plan {
  if (!isRecord(value)) return false
  const { contacts, meetingPoints, items } = value
  if (!Array.isArray(contacts) || !Array.isArray(meetingPoints) || !Array.isArray(items)) {
    return false
  }
  return (
    contacts.every(
      (c) =>
        isRecord(c) &&
        hasStringFields(c, ['id', 'name', 'phone', 'notes']) &&
        typeof c.memorized === 'boolean' &&
        typeof c.essential === 'boolean',
    ) &&
    meetingPoints.every(
      (p) =>
        isRecord(p) &&
        hasStringFields(p, ['id', 'label', 'address', 'notes']) &&
        typeof p.essential === 'boolean',
    ) &&
    items.every(
      (item) =>
        isRecord(item) &&
        hasStringFields(item, ['id', 'name', 'category', 'notes']) &&
        Array.isArray(item.dependencies) &&
        item.dependencies.every(isDependency) &&
        typeof item.essential === 'boolean',
    )
  )
}

export function savePlan(plan: Plan, storage: Storage = localStorage): boolean {
  const envelope: Envelope = { version: SCHEMA_VERSION, plan }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(envelope))
    return true
  } catch {
    // Quota exceeded or storage disabled — the caller keeps its in-memory plan.
    return false
  }
}

export function clearPlan(storage: Storage = localStorage): void {
  storage.removeItem(STORAGE_KEY)
}

export function loadPlan(storage: Storage = localStorage): LoadResult {
  const raw = storage.getItem(STORAGE_KEY)
  if (raw === null) return { status: 'empty', plan: emptyPlan() }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { status: 'rejected', plan: emptyPlan(), reason: 'stored value is not valid JSON' }
  }

  // Bare plan without an envelope = version 0 (pre-versioned era).
  let version: number
  let data: unknown
  if (isRecord(parsed) && typeof parsed.version === 'number' && 'plan' in parsed) {
    version = parsed.version
    data = parsed.plan
  } else {
    version = 0
    data = parsed
  }

  if (version > SCHEMA_VERSION) {
    return {
      status: 'rejected',
      plan: emptyPlan(),
      reason: `stored plan uses schema v${version}, newer than supported v${SCHEMA_VERSION}`,
    }
  }

  const migratedFrom = version < SCHEMA_VERSION ? version : undefined
  while (version < SCHEMA_VERSION) {
    const migrate = MIGRATIONS[version]
    if (!migrate) {
      return {
        status: 'rejected',
        plan: emptyPlan(),
        reason: `no migration from schema v${version}`,
      }
    }
    data = migrate(data)
    version += 1
  }

  if (!isPlanShaped(data)) {
    return { status: 'rejected', plan: emptyPlan(), reason: 'stored plan has an unexpected shape' }
  }

  return migratedFrom === undefined
    ? { status: 'loaded', plan: data }
    : { status: 'loaded', plan: data, migratedFrom }
}

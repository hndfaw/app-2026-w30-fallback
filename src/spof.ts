// Single-point-of-failure analyzer (ticket 6).
//
// A critical item with exactly one dependency has no backup: losing that one
// channel or person breaks it outright, with nothing to fall back on. This
// flags those items and groups them by the dependency that would take them
// out, so a household can see which single channel or person is riskiest to
// lose.

import { type CriticalItem, type Dependency, type Plan, sameDependency } from './model'

export interface SinglePointOfFailure {
  item: CriticalItem
  dependency: Dependency
}

/** Critical items that depend on exactly one channel or person — no redundancy. */
export function singlePointsOfFailure(plan: Plan): SinglePointOfFailure[] {
  return plan.items
    .filter((item) => item.dependencies.length === 1)
    .map((item) => ({ item, dependency: item.dependencies[0] }))
}

export interface DependencyRisk {
  dependency: Dependency
  items: CriticalItem[]
}

/**
 * Single points of failure grouped by the dependency that causes them, most
 * items first. A dependency with three items in its group means losing that
 * one channel or person alone breaks three things with no fallback.
 */
export function spofsByDependency(plan: Plan): DependencyRisk[] {
  const groups: DependencyRisk[] = []
  for (const { item, dependency } of singlePointsOfFailure(plan)) {
    const group = groups.find((g) => sameDependency(g.dependency, dependency))
    if (group) {
      group.items.push(item)
    } else {
      groups.push({ dependency, items: [item] })
    }
  }
  return groups.sort((a, b) => b.items.length - a.items.length)
}

/** Human label for a dependency, e.g. "power" or "Mom". */
export function dependencyLabel(dependency: Dependency, plan: Plan): string {
  if (dependency.kind === 'channel') return dependency.channel
  const contact = plan.contacts.find((c) => c.id === dependency.contactId)
  return contact?.name.trim() || 'Unknown person'
}

// A filled-in example plan for onboarding (ticket 11) — lets a new user see
// what a finished plan looks like before building their own. The household
// story (Mom holds the med schedule and spare key, the radio needs power
// alone, the safe needs power and internet) mirrors the fixtures used across
// stress.test.ts and spof.test.ts, so scenario results and SPOF flags read
// the same way here as they do in those tests.

import { channelDep, newContact, newCriticalItem, newMeetingPoint, personDep, type Plan } from './model'

export function samplePlan(): Plan {
  const mom = newContact({
    name: 'Mom',
    phone: '555-0100',
    memorized: true,
    notes: 'Knows the med schedule and has a spare house key.',
    essential: true,
  })
  const neighbor = newContact({
    name: 'Neighbor — Sam',
    phone: '555-0199',
    notes: 'Two doors down, has a spare key too.',
    essential: false,
  })

  const schoolGate = newMeetingPoint({
    label: 'School gate',
    address: '12 Elm St',
    notes: 'Default meeting point if home is unreachable.',
    essential: true,
  })
  const grandmas = newMeetingPoint({
    label: "Grandma's house",
    address: '48 Birch Ave',
    notes: 'Backup if the school gate is also unreachable.',
    essential: false,
  })

  const radio = newCriticalItem({
    name: 'Emergency radio',
    category: 'utility',
    dependencies: [channelDep('power')],
    notes: 'Battery pack in the hall closet is the fallback.',
    essential: true,
  })
  const meds = newCriticalItem({
    name: 'Insulin schedule',
    category: 'medication',
    dependencies: [personDep(mom.id)],
    notes: 'Written copy taped inside the medicine cabinet.',
    essential: true,
  })
  const keyPickup = newCriticalItem({
    name: 'Spare key pickup',
    category: 'other',
    dependencies: [personDep(mom.id)],
    notes: 'Neighbor also holds a spare — ask Sam if Mom is unreachable.',
    essential: false,
  })
  const safe = newCriticalItem({
    name: 'Fireproof safe combination',
    category: 'document',
    dependencies: [channelDep('power'), channelDep('internet')],
    notes: 'Combination is also written on the back of the insurance card.',
    essential: true,
  })
  const passports = newCriticalItem({
    name: 'Passports',
    category: 'document',
    notes: 'Top drawer of the safe.',
    essential: true,
  })

  return {
    contacts: [mom, neighbor],
    meetingPoints: [schoolGate, grandmas],
    items: [radio, meds, keyPickup, safe, passports],
  }
}

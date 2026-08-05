import { afterEach, expect, test } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import ScenarioResults from './ScenarioResults'
import { channelDep, newContact, newCriticalItem, newMeetingPoint, personDep, type Plan } from './model'

afterEach(cleanup)

// Mom is memorized; the neighbor's number lives only in a phone. The radio
// needs power, the med schedule needs power and Mom, the passports need nothing.
function samplePlan(): Plan {
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
  return {
    contacts: [mom, neighbor],
    meetingPoints: [newMeetingPoint({ label: 'School gate', address: '12 Elm St' })],
    items: [radio, meds, passports],
  }
}

test('an empty plan still tests the three channel losses, all passing', () => {
  render(<ScenarioResults plan={{ contacts: [], meetingPoints: [], items: [] }} />)
  expect(screen.getByRole('heading', { name: 'Loss of phone — Pass' })).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Loss of power — Pass' })).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Loss of internet — Pass' })).toBeTruthy()
})

test('renders one row per scenario with pass/fail', () => {
  render(<ScenarioResults plan={samplePlan()} />)
  expect(screen.getByRole('heading', { name: 'Loss of internet — Pass' })).toBeTruthy()
  expect(screen.getByRole('heading', { name: /Loss of power — Fail/ })).toBeTruthy()
  expect(screen.getByRole('heading', { name: /Mom unavailable — Fail/ })).toBeTruthy()
  expect(screen.getByRole('heading', { name: /Neighbor unavailable — Pass/ })).toBeTruthy()
})

test('lists concrete gaps for a failing scenario', () => {
  render(<ScenarioResults plan={samplePlan()} />)
  const heading = screen.getByRole('heading', { name: /Loss of power — Fail/ })
  const row = heading.closest('li')
  expect(row).toBeTruthy()
  const gaps = within(row as HTMLElement).getAllByRole('listitem')
  expect(gaps.map((li) => li.textContent)).toEqual([
    'Emergency radio fails — depends on power',
    'Insulin schedule fails — depends on power',
  ])
})

test('a passing scenario shows a confirmation instead of gaps', () => {
  render(<ScenarioResults plan={samplePlan()} />)
  const heading = screen.getByRole('heading', { name: 'Loss of internet — Pass' })
  const row = heading.closest('li')
  expect(within(row as HTMLElement).getByText('Everything critical still works.')).toBeTruthy()
})

test('an unreachable contact is reported as a gap', () => {
  const plan = samplePlan()
  render(<ScenarioResults plan={plan} />)
  const heading = screen.getByRole('heading', { name: /Loss of phone — Fail/ })
  const row = heading.closest('li')
  expect(
    within(row as HTMLElement).getByText('Neighbor becomes unreachable'),
  ).toBeTruthy()
})

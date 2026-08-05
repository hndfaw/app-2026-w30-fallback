import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import FallbackCard from './FallbackCard'
import { newContact, newCriticalItem, newMeetingPoint, type Plan } from './model'

afterEach(cleanup)

function emptyPlan(): Plan {
  return { contacts: [], meetingPoints: [], items: [] }
}

test('shows a prompt instead of a card when nothing is marked essential', () => {
  const plan = emptyPlan()
  plan.contacts.push(newContact({ name: 'Mom' }))
  render(<FallbackCard plan={plan} />)
  expect(screen.getByText(/nothing marked essential yet/i)).toBeTruthy()
  expect(screen.queryByRole('button', { name: /print fallback card/i })).toBeNull()
})

test('renders essential entries on both card copies, skipping non-essential ones', () => {
  const plan = emptyPlan()
  plan.contacts.push(
    newContact({ name: 'Mom', phone: '555-0100', essential: true }),
    newContact({ name: 'Neighbor', phone: '555-0199', essential: false }),
  )
  plan.meetingPoints.push(
    newMeetingPoint({ label: 'School gate', address: '12 Elm St', essential: true }),
  )
  plan.items.push(
    newCriticalItem({ name: 'Insulin', category: 'medication', essential: true }),
    newCriticalItem({ name: 'Passports', category: 'document', essential: false }),
  )

  render(<FallbackCard plan={plan} />)

  expect(screen.getByRole('button', { name: /print fallback card/i })).toBeTruthy()
  expect(screen.getAllByText(/Mom — 555-0100/)).toHaveLength(2)
  expect(screen.getAllByText(/School gate — 12 Elm St/)).toHaveLength(2)
  expect(screen.getAllByText(/Insulin/)).toHaveLength(2)
  expect(screen.queryByText(/Neighbor/)).toBeNull()
  expect(screen.queryByText(/Passports/)).toBeNull()
})

test('the fridge copy shows item category, the wallet copy omits it', () => {
  const plan = emptyPlan()
  plan.items.push(newCriticalItem({ name: 'Insulin', category: 'medication', essential: true }))

  render(<FallbackCard plan={plan} />)

  const fridge = document.querySelector('.fallback-card--fridge') as HTMLElement
  const wallet = document.querySelector('.fallback-card--wallet') as HTMLElement
  expect(fridge.textContent).toContain('Insulin (medication)')
  expect(wallet.textContent).toContain('Insulin')
  expect(wallet.textContent).not.toContain('(medication)')
})

test('the print button triggers window.print', () => {
  const plan = emptyPlan()
  plan.contacts.push(newContact({ name: 'Mom', essential: true }))
  const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

  render(<FallbackCard plan={plan} />)
  screen.getByRole('button', { name: /print fallback card/i }).click()

  expect(printSpy).toHaveBeenCalledTimes(1)
  printSpy.mockRestore()
})

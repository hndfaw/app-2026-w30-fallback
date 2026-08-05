import { afterEach, beforeEach, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import { STORAGE_KEY } from './storage'

beforeEach(() => {
  localStorage.clear()
})

afterEach(cleanup)

test('renders the app heading and pitch', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Fallback' })).toBeTruthy()
  expect(screen.getByText(/stress-test your household emergency plan/i)).toBeTruthy()
})

test('renders the contacts and meeting points sections', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Contacts' })).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Meeting points' })).toBeTruthy()
})

test('adding a contact persists it to localStorage', async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Add contact' }))
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Mom' } })

  await waitFor(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.plan.contacts).toHaveLength(1)
    expect(stored.plan.contacts[0].name).toBe('Mom')
  })
})

test('a previously saved plan loads back into the forms', async () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      plan: {
        contacts: [{ id: '1', name: 'Dad', phone: '555-0101', memorized: false, notes: '' }],
        meetingPoints: [{ id: '2', label: 'School gate', address: '12 Elm St', notes: '' }],
        items: [],
      },
    }),
  )

  render(<App />)

  expect(await screen.findByDisplayValue('Dad')).toBeTruthy()
  expect(screen.getByDisplayValue('School gate')).toBeTruthy()
})

test('does not overwrite a saved plan with an empty one while loading', async () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      plan: {
        contacts: [{ id: '1', name: 'Dad', phone: '', memorized: false, notes: '' }],
        meetingPoints: [],
        items: [],
      },
    }),
  )

  render(<App />)
  await screen.findByDisplayValue('Dad')

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
  expect(stored.plan.contacts).toHaveLength(1)
})

test('offers to load a sample plan when there is nothing saved yet', async () => {
  render(<App />)
  expect(await screen.findByRole('button', { name: 'Load sample plan' })).toBeTruthy()
})

test('loading the sample plan fills the forms and hides the onboarding prompt', async () => {
  render(<App />)
  fireEvent.click(await screen.findByRole('button', { name: 'Load sample plan' }))

  expect(await screen.findByDisplayValue('Mom')).toBeTruthy()
  expect(screen.getByDisplayValue('School gate')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Load sample plan' })).toBeFalsy()
})

test('does not offer the sample plan once a saved plan already has data', async () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      plan: {
        contacts: [{ id: '1', name: 'Dad', phone: '555-0101', memorized: false, notes: '' }],
        meetingPoints: [],
        items: [],
      },
    }),
  )

  render(<App />)
  await screen.findByDisplayValue('Dad')

  expect(screen.queryByRole('button', { name: 'Load sample plan' })).toBeFalsy()
})

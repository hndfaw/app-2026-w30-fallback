import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ContactsForm from './ContactsForm'
import { newContact } from './model'

afterEach(cleanup)

test('renders existing contacts', () => {
  const mom = newContact({ name: 'Mom', phone: '555-0100', memorized: true, notes: 'Cell' })
  render(<ContactsForm contacts={[mom]} onChange={() => {}} />)
  expect(screen.getByDisplayValue('Mom')).toBeTruthy()
  expect(screen.getByDisplayValue('555-0100')).toBeTruthy()
  expect(screen.getByDisplayValue('Cell')).toBeTruthy()
  expect((screen.getByLabelText(/memorized/i) as HTMLInputElement).checked).toBe(true)
})

test('editing a field calls onChange with the updated contact', () => {
  const mom = newContact({ name: 'Mom' })
  const onChange = vi.fn()
  render(<ContactsForm contacts={[mom]} onChange={onChange} />)
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Mother' } })
  expect(onChange).toHaveBeenCalledWith([{ ...mom, name: 'Mother' }])
})

test('add contact appends a new blank contact', () => {
  const onChange = vi.fn()
  render(<ContactsForm contacts={[]} onChange={onChange} />)
  fireEvent.click(screen.getByRole('button', { name: 'Add contact' }))
  expect(onChange).toHaveBeenCalledTimes(1)
  const added = onChange.mock.calls[0][0]
  expect(added).toHaveLength(1)
  expect(added[0]).toMatchObject({ name: '', phone: '', memorized: false, notes: '', essential: false })
})

test('checking essential calls onChange with the updated contact', () => {
  const mom = newContact({ name: 'Mom' })
  const onChange = vi.fn()
  render(<ContactsForm contacts={[mom]} onChange={onChange} />)
  fireEvent.click(screen.getByLabelText(/essential/i))
  expect(onChange).toHaveBeenCalledWith([{ ...mom, essential: true }])
})

test('remove deletes the contact', () => {
  const mom = newContact({ name: 'Mom' })
  const dad = newContact({ name: 'Dad' })
  const onChange = vi.fn()
  render(<ContactsForm contacts={[mom, dad]} onChange={onChange} />)
  fireEvent.click(screen.getByRole('button', { name: 'Remove Mom' }))
  expect(onChange).toHaveBeenCalledWith([dad])
})

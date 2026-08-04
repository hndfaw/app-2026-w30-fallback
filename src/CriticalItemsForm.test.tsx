import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import CriticalItemsForm from './CriticalItemsForm'
import { channelDep, newContact, newCriticalItem, personDep } from './model'

afterEach(cleanup)

test('renders existing item fields', () => {
  const meds = newCriticalItem({ name: 'Insulin', category: 'medication', notes: 'Fridge' })
  render(<CriticalItemsForm items={[meds]} contacts={[]} onChange={() => {}} />)
  expect(screen.getByDisplayValue('Insulin')).toBeTruthy()
  expect(screen.getByDisplayValue('Fridge')).toBeTruthy()
  expect((screen.getByLabelText('Category') as HTMLSelectElement).value).toBe('medication')
})

test('editing name calls onChange with the updated item', () => {
  const meds = newCriticalItem({ name: 'Insulin' })
  const onChange = vi.fn()
  render(<CriticalItemsForm items={[meds]} contacts={[]} onChange={onChange} />)
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Insulin pens' } })
  expect(onChange).toHaveBeenCalledWith([{ ...meds, name: 'Insulin pens' }])
})

test('add item appends a new blank item', () => {
  const onChange = vi.fn()
  render(<CriticalItemsForm items={[]} contacts={[]} onChange={onChange} />)
  fireEvent.click(screen.getByRole('button', { name: 'Add critical item' }))
  expect(onChange).toHaveBeenCalledTimes(1)
  const added = onChange.mock.calls[0][0]
  expect(added).toHaveLength(1)
  expect(added[0]).toMatchObject({ name: '', category: 'other', dependencies: [], notes: '' })
})

test('remove deletes the item', () => {
  const meds = newCriticalItem({ name: 'Insulin' })
  const documents = newCriticalItem({ name: 'Passports' })
  const onChange = vi.fn()
  render(<CriticalItemsForm items={[meds, documents]} contacts={[]} onChange={onChange} />)
  fireEvent.click(screen.getByRole('button', { name: 'Remove Insulin' }))
  expect(onChange).toHaveBeenCalledWith([documents])
})

test('checking a channel dependency adds it', () => {
  const meds = newCriticalItem({ name: 'Insulin' })
  const onChange = vi.fn()
  render(<CriticalItemsForm items={[meds]} contacts={[]} onChange={onChange} />)
  fireEvent.click(screen.getByLabelText('power'))
  expect(onChange).toHaveBeenCalledWith([{ ...meds, dependencies: [channelDep('power')] }])
})

test('unchecking a channel dependency removes it', () => {
  const meds = newCriticalItem({ name: 'Insulin', dependencies: [channelDep('power')] })
  const onChange = vi.fn()
  render(<CriticalItemsForm items={[meds]} contacts={[]} onChange={onChange} />)
  fireEvent.click(screen.getByLabelText('power'))
  expect(onChange).toHaveBeenCalledWith([{ ...meds, dependencies: [] }])
})

test('checking a person dependency adds it', () => {
  const mom = newContact({ name: 'Mom' })
  const meds = newCriticalItem({ name: 'Insulin' })
  const onChange = vi.fn()
  render(<CriticalItemsForm items={[meds]} contacts={[mom]} onChange={onChange} />)
  fireEvent.click(screen.getByLabelText('Mom'))
  expect(onChange).toHaveBeenCalledWith([{ ...meds, dependencies: [personDep(mom.id)] }])
})

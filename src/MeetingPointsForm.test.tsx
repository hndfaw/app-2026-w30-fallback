import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import MeetingPointsForm from './MeetingPointsForm'
import { newMeetingPoint } from './model'

afterEach(cleanup)

test('renders existing meeting points', () => {
  const school = newMeetingPoint({ label: 'School gate', address: '12 Elm St', notes: 'Front door' })
  render(<MeetingPointsForm meetingPoints={[school]} onChange={() => {}} />)
  expect(screen.getByDisplayValue('School gate')).toBeTruthy()
  expect(screen.getByDisplayValue('12 Elm St')).toBeTruthy()
  expect(screen.getByDisplayValue('Front door')).toBeTruthy()
})

test('editing a field calls onChange with the updated meeting point', () => {
  const school = newMeetingPoint({ label: 'School gate' })
  const onChange = vi.fn()
  render(<MeetingPointsForm meetingPoints={[school]} onChange={onChange} />)
  fireEvent.change(screen.getByLabelText('Address'), { target: { value: '12 Elm St' } })
  expect(onChange).toHaveBeenCalledWith([{ ...school, address: '12 Elm St' }])
})

test('add meeting point appends a new blank meeting point', () => {
  const onChange = vi.fn()
  render(<MeetingPointsForm meetingPoints={[]} onChange={onChange} />)
  fireEvent.click(screen.getByRole('button', { name: 'Add meeting point' }))
  expect(onChange).toHaveBeenCalledTimes(1)
  const added = onChange.mock.calls[0][0]
  expect(added).toHaveLength(1)
  expect(added[0]).toMatchObject({ label: '', address: '', notes: '', essential: false })
})

test('checking essential calls onChange with the updated meeting point', () => {
  const school = newMeetingPoint({ label: 'School gate' })
  const onChange = vi.fn()
  render(<MeetingPointsForm meetingPoints={[school]} onChange={onChange} />)
  fireEvent.click(screen.getByLabelText(/essential/i))
  expect(onChange).toHaveBeenCalledWith([{ ...school, essential: true }])
})

test('remove deletes the meeting point', () => {
  const school = newMeetingPoint({ label: 'School gate' })
  const park = newMeetingPoint({ label: 'Park' })
  const onChange = vi.fn()
  render(<MeetingPointsForm meetingPoints={[school, park]} onChange={onChange} />)
  fireEvent.click(screen.getByRole('button', { name: 'Remove School gate' }))
  expect(onChange).toHaveBeenCalledWith([park])
})

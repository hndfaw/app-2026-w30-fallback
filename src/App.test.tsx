import { afterEach, expect, test } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import App from './App'

afterEach(cleanup)

test('renders the app heading and pitch', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Fallback' })).toBeTruthy()
  expect(screen.getByText(/stress-test your household emergency plan/i)).toBeTruthy()
})

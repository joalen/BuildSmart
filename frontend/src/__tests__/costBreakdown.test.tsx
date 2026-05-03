import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Cart from '../pages/Cart'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const mockItems = [
  { product: { itemId: '123', name: 'Ceramic Tile', price: 45.99, in_stock: true, quantity: 10, brand: null, image: null, url: null, store_name: 'Dallas' }, qty: 3, category: 'material' },
  { product: { itemId: '456', name: 'Tile Adhesive', price: 12.50, in_stock: true, quantity: 5, brand: null, image: null, url: null, store_name: 'Dallas' }, qty: 2, category: 'material' },
]

beforeEach(() => {
  localStorage.setItem('buildsmart_cart', JSON.stringify(mockItems))
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: false } as Response)
})

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

test('displays correct subtotal', () => {
  render(<MemoryRouter><Cart /></MemoryRouter>)
  expect(screen.getAllByText('$162.97').length).toBeGreaterThan(0)
})

test('displays correct tax for Texas zip', () => {
  render(<MemoryRouter><Cart /></MemoryRouter>)
  expect(screen.getByText('Estimated Sales Tax (8.25%)')).toBeInTheDocument()
  expect(screen.getByText('$13.45')).toBeInTheDocument()
})

test('total equals subtotal plus tax', () => {
  render(<MemoryRouter><Cart /></MemoryRouter>)
  expect(screen.getByText('$176.42')).toBeInTheDocument()
})
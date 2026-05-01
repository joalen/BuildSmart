import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CostEstimate from '../pages/CostEstimate' // adjust path
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const mockPlanState = {
    overview: 'Tile bathroom',
    materials: [{ id: 1, name: 'Ceramic Tile', quantity: '114', unit: 'sq ft' }],
    tools: [{ id: 1, name: 'Tile saw' }],
    steps: [],
    input: 'Retile my bathroom',
}

const mockProduct = { itemId: '123', name: 'Ceramic Floor Tile', brand: 'HDX', price: 2.50, image: '', url: '' }
const mockRec = { item_id: '999', name: 'Tile Spacers', category: 'Flooring', score: 85, price: 4.99, image: '', url: '' }

beforeEach(() => {
    localStorage.clear()
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/homedepot/search')) {
            return Promise.resolve({ json: () => Promise.resolve({ products: [mockProduct] }) })
        }
        if (url.includes('/homedepot/recommendations')) {
            return Promise.resolve({ json: () => Promise.resolve([mockRec]) })
        }
        if (url.includes('/events/sku')) {
            return Promise.resolve({ json: () => Promise.resolve({ ok: true }) })
        }
        return Promise.resolve({ json: () => Promise.resolve({}) })
    })
})

afterEach(() => vi.restoreAllMocks())

function renderWithState() {
    return render(
        <MemoryRouter initialEntries={[{ pathname: '/cost', state: mockPlanState }]}>
            <Routes>
                <Route path="/cost" element={<CostEstimate />} />
            </Routes>
        </MemoryRouter>
    )
}

test('recommendations appear with name and price', async () => {
    renderWithState()
    await waitFor(() => expect(screen.getByText('Tile Spacers')).toBeInTheDocument())
    expect(screen.getByText('$4.99')).toBeInTheDocument()
})

test('adding rec to cart stores it in localStorage', async () => {
    renderWithState()
    await waitFor(() => screen.getByText('Tile Spacers'))

    const recCard = screen.getByText('Tile Spacers').closest('div')!
    await act(async () => {
        fireEvent.click(within(recCard).getByText('Add to cart'))
    })

    const cart = JSON.parse(localStorage.getItem('buildsmart_cart') ?? '[]')
    expect(cart.length).toBe(1)
    expect(cart[0].product.itemId).toBe('999')
})

test('adding same item twice does not duplicate', async () => {
    renderWithState()
    await waitFor(() => screen.getByText('Tile Spacers'))

    const btn = screen.getAllByText('Add to cart')[0]
    await act(async () => { fireEvent.click(btn) })
    await act(async () => { fireEvent.click(btn) })

    const cart = JSON.parse(localStorage.getItem('buildsmart_cart') ?? '[]')
    expect(cart.length).toBe(1)
    expect(cart[0].qty).toBe(2)
})
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Cart, { type CartProduct } from '../pages/Cart'

const mockOriginal: CartProduct = {
    itemId: 'OG123', brand: 'Acme', name: 'Original Drill', price: 49.99,
    image: null, url: null, in_stock: false, store_name: null, quantity: 0,
}

const mockSwap: CartProduct = {
    itemId: 'SW456', brand: 'Dewalt', name: 'Swap Drill', price: 54.99,
    image: null, url: null, in_stock: true, store_name: 'Store A', quantity: 12,
}

const cartItem = { product: mockOriginal, qty: 1, category: 'tool' as const }

beforeEach(() => {
    localStorage.setItem('buildsmart_cart', JSON.stringify([cartItem]))

    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
        if (url.includes('nearby-stores'))
            return { ok: true, json: async () => [{ storeId: '0550', storeName: 'Store A', distance: '1.2 mi', postalCode: '75218' }] }

        if (url.includes('search/with-swaps'))
            return { ok: true, json: async () => ({ products: [mockSwap] }) }

        if (url.includes('/item'))
            return { ok: true, json: async () => mockOriginal }

        return { ok: false, json: async () => ({}) }
    }))
})

const renderCart = () =>
    render(<MemoryRouter><Cart /></MemoryRouter>)

describe('Cart swap flow', () => {
    it('shows swap suggestion for OOS item', async () => {
        renderCart()
        await waitFor(() => expect(screen.getByText('Swap Drill')).toBeInTheDocument())
        expect(screen.getByText(/swap suggestion — in stock at/i)).toBeInTheDocument()
    })

    it('swap replaces original item with correct fields', async () => {
        renderCart()
        await waitFor(() => screen.getByText('Swap Drill'))

        fireEvent.click(screen.getByRole('button', { name: /swap/i }))

        await waitFor(() => {
            expect(screen.getByText('Swap Drill')).toBeInTheDocument()
            expect(screen.getByText(/SW456/)).toBeInTheDocument()

            const table = document.querySelector('table')!
            expect(table.textContent).toContain('$54.99')
        })
    })

    it('hides swap suggestion row after swap is applied', async () => {
        renderCart()
        await waitFor(() => screen.getByText('Swap Drill'))

        fireEvent.click(screen.getByRole('button', { name: /swap/i }))

        await waitFor(() => {
            expect(screen.queryByText(/swap suggestion/i)).not.toBeInTheDocument()
        })
    })

    it('removes OOS red highlight after swap', async () => {
        renderCart()
        await waitFor(() => screen.getByText('Swap Drill'))

        fireEvent.click(screen.getByRole('button', { name: /swap/i }))

        await waitFor(() => {
            const badge = screen.queryByText(/out of stock/i, { selector: 'span.text-red-600' })
            expect(badge).not.toBeInTheDocument()
        })
    })

    it('persists swapped item to localStorage', async () => {
        renderCart()
        await waitFor(() => screen.getByText('Swap Drill'))

        fireEvent.click(screen.getByRole('button', { name: /swap/i }))

        await waitFor(() => {
            const saved = JSON.parse(localStorage.getItem('buildsmart_cart')!)
            expect(saved[0].product.itemId).toBe('SW456')
            expect(saved[0].product.name).toBe('Swap Drill')
        })
    })
})
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Cart from '../pages/Cart'

interface CartProduct {
    itemId: string; brand: string | null; name: string | null; price: number | null
    image: string | null; url: string | null; in_stock: boolean; store_name: string | null; quantity: number | null
}

interface CartItem {
    product: CartProduct; qty: number; category: 'material' | 'tool' | 'other'
}

const mockOriginal: CartProduct = {
    itemId: 'IN001', brand: 'Acme', name: 'Test Product', price: 29.99,
    image: null, url: null, in_stock: false, store_name: null, quantity: 0,
}

const renderCart = () => render(<MemoryRouter><Cart /></MemoryRouter>)

beforeEach(() => {
    const item: CartItem = { product: mockOriginal, qty: 1, category: 'material' }
    localStorage.setItem('buildsmart_cart', JSON.stringify([item]))
})

describe('Zip code updates inventory availability display', () => {
    beforeEach(() => {
        const inStockItem: CartItem = {
            product: { ...mockOriginal, itemId: 'IN001', in_stock: false, store_name: null, quantity: 0 },
            qty: 1,
            category: 'material',
        }
        localStorage.setItem('buildsmart_cart', JSON.stringify([inStockItem]))
    })

    it('shows in-stock badge with unit count and store name after zip update', async () => {
        vi.stubGlobal('fetch', vi.fn(async (url: string) => {
            if (url.includes('nearby-stores'))
                return { ok: true, json: async () => [{ storeId: '550', storeName: 'Skillman', distance: '3.3 mi', postalCode: '75206' }] }
            if (url.includes('/item'))
                return { ok: true, json: async () => ({ ...mockOriginal, itemId: 'IN001', in_stock: true, store_name: 'Skillman', quantity: 42 }) }
            if (url.includes('search/with-swaps'))
                return { ok: true, json: async () => ({ products: [] }) }
            return { ok: false, json: async () => ({}) }
        }))

        renderCart()

        fireEvent.change(screen.getByPlaceholderText(/change zip/i), { target: { value: '75206' } })
        fireEvent.click(screen.getByRole('button', { name: /update/i }))

        await waitFor(() => {
            expect(screen.getByText(/in stock · 42 units/i)).toBeInTheDocument()
            const badge = screen.getByText(/in stock · 42 units/i)
            expect(badge.closest('td')).toHaveTextContent('Skillman')
        })
    })

    it('shows OOS badge and red row when item is out of stock at new zip', async () => {
        vi.stubGlobal('fetch', vi.fn(async (url: string) => {
            if (url.includes('nearby-stores'))
                return { ok: true, json: async () => [{ storeId: '999', storeName: 'Mesquite', distance: '8.1 mi', postalCode: '75149' }] }
            if (url.includes('/item'))
                return { ok: true, json: async () => ({ ...mockOriginal, itemId: 'IN001', in_stock: false, store_name: null, quantity: 0 }) }
            if (url.includes('search/with-swaps'))
                return { ok: true, json: async () => ({ products: [] }) }
            return { ok: false, json: async () => ({}) }
        }))

        renderCart()

        fireEvent.change(screen.getByPlaceholderText(/change zip/i), { target: { value: '75149' } })
        fireEvent.click(screen.getByRole('button', { name: /update/i }))

        await waitFor(() => {
            expect(screen.getByText(/out of stock/i, { selector: 'span.text-red-600' })).toBeInTheDocument()
            expect(document.querySelector('tr.bg-red-50\\/40')).toBeInTheDocument()
        })
    })

    it('updates store name in header after zip change', async () => {
        vi.stubGlobal('fetch', vi.fn(async (url: string) => {
            if (url.includes('nearby-stores'))
                return { ok: true, json: async () => [{ storeId: '750', storeName: 'Skillman', distance: '3.3 mi', postalCode: '75206' }] }
            if (url.includes('/item'))
                return { ok: true, json: async () => ({ ...mockOriginal, itemId: 'IN001', in_stock: true, store_name: 'Skillman', quantity: 10 }) }
            if (url.includes('search/with-swaps'))
                return { ok: true, json: async () => ({ products: [] }) }
            return { ok: false, json: async () => ({}) }
        }))

        renderCart()

        fireEvent.change(screen.getByPlaceholderText(/change zip/i), { target: { value: '75206' } })
        fireEvent.click(screen.getByRole('button', { name: /update/i }))

        await waitFor(() => {
            expect(screen.getByText(/skillman — the home depot/i)).toBeInTheDocument()
        })
    })
})
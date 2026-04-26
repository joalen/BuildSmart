import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, RefreshCw, Download, ArrowRightLeft, Minus, Plus, AlertTriangle, CheckCircle2, XCircle, ShoppingCart, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface CartProduct {
    itemId: string
    brand: string | null
    name: string | null
    price: number | null
    image: string | null
    url: string | null
    in_stock: boolean
    store_name: string | null
    quantity: number | null
}

interface SwapMap {
    [itemId: string]: CartProduct
}

interface CartItem {
    product: CartProduct
    qty: number
    category: 'material' | 'tool' | 'other'
}

interface NearbyStore {
    storeId: string
    storeName: string
    distance: string
    postalCode: string
    available?: number
    total?: number
}

function loadCart(): CartItem[] {
    try {
        const stored = localStorage.getItem('buildsmart_cart')
        if (stored) {
            const parsed = JSON.parse(stored)
            if (parsed.length > 0) return parsed
        }
    } catch { }
    return []
}

function saveCart(items: CartItem[]) {
    localStorage.setItem('buildsmart_cart', JSON.stringify(items))
}

function StockBadge({ product }: { product: CartProduct }) {
    if (!product.store_name) {
        return (
            <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-500" />
                <span className="text-xs text-red-600 font-medium">Out of stock</span>
            </div>
        )
    }
    const isLow = product.quantity !== null && product.quantity <= 3
    return (
        <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
                {isLow
                    ? <AlertTriangle className="w-3 h-3 text-amber-500" />
                    : <CheckCircle2 className="w-3 h-3 text-green-600" />
                }
                <span className={`text-xs font-medium ${isLow ? 'text-amber-600' : 'text-green-700'}`}>
                    {isLow ? 'Low stock' : 'In stock'} · {product.quantity} units
                </span>
            </div>
            <span className="text-[10px] text-muted-foreground">{product.store_name}</span>
        </div>
    )
}

export default function Cart() {
    const navigate = useNavigate()
    const [cartItems, setCartItems] = useState<CartItem[]>(loadCart)
    const [zip, setZip] = useState('75218')
    const [zipInput, setZipInput] = useState('75218')
    const [storeName, setStoreName] = useState<string | null>(null)
    const [swaps, setSwaps] = useState<SwapMap>({})
    const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([])
    const [loading, setLoading] = useState(false)
    const [swappedItems, setSwappedItems] = useState<Set<string>>(new Set())

    const refreshInventory = useCallback(async (targetZip: string) => {
        setLoading(true)
        try {
            const byId: Record<string, CartProduct> = {}

            // search for each cart item individually by name
            await Promise.all(
                cartItems.map(async ({ product: p }) => {
                    const res = await fetch('http://localhost:8000/homedepot/item', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ itemId: p.itemId, storeId: '550' }),
                    })
                    if (!res.ok) return
                    const data: CartProduct = await res.json()
                    if (data.itemId) byId[data.itemId] = data
                })
            )

            setSwaps({ ...swaps })
            setCartItems(prev => {
                const updated = prev.map(item => ({
                    ...item,
                    product: byId[item.product.itemId] ?? { ...item.product, in_stock: false, store_name: null, quantity: null },
                }))
                saveCart(updated)
                return updated
            })

            const inStockProduct = Object.values(byId).find(p => p.store_name)
            if (inStockProduct?.store_name) setStoreName(inStockProduct.store_name)

            await fetchNearbyStores(targetZip, Object.values(byId))
        } catch (err) {
            console.error('Inventory refresh failed', err)
        } finally {
            setLoading(false)
        }
    }, [cartItems])

    async function fetchNearbyStores(targetZip: string, products: CartProduct[]) {
        try {
            const storesRes = await fetch('http://localhost:8000/homedepot/nearby-stores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ zipCode: targetZip })
            })
            if (!storesRes.ok) return
            const stores: { storeId: string; storeName: string; distance: string; postalCode: string }[] = await storesRes.json()
    
            const storesWithAvailability = await Promise.all(
                stores.map(async store => {
                    const checks = await Promise.all(
                        products.map(async p => {
                            const res = await fetch('http://localhost:8000/homedepot/item', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ itemId: p.itemId, storeId: store.storeId })
                            })
                            if (!res.ok) return false
                            const data: CartProduct = await res.json()
                            return data.in_stock
                        })
                    )
                    return {
                        ...store,
                        available: checks.filter(Boolean).length,
                        total: products.length
                    }
                })
            )
    
            setNearbyStores(storesWithAvailability)
        } catch (err) {
            console.error('fetchNearbyStores failed', err)
        }
    }

    useEffect(() => {
        if (cartItems.length > 0) {
            refreshInventory(zip)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    function updateQty(itemId: string, delta: number) {
        setCartItems(prev => {
            const updated = prev.map(item =>
                item.product.itemId === itemId
                    ? { ...item, qty: Math.max(1, item.qty + delta) }
                    : item
            )
            saveCart(updated)
            return updated
        })
    }

    function removeItem(itemId: string) {
        setCartItems(prev => {
            const updated = prev.filter(item => item.product.itemId !== itemId)
            saveCart(updated)
            return updated
        })
    }

    function applySwap(originalId: string) {
        const swap = swaps[originalId]
        if (!swap) return
        setCartItems(prev => {
            const updated = prev.map(item =>
                item.product.itemId === originalId ? { ...item, product: swap } : item
            )
            saveCart(updated)
            return updated
        })
        setSwappedItems(prev => new Set([...prev, originalId]))
    }

    function handleClearCart() {
        localStorage.removeItem('buildsmart_cart')
        setCartItems([])
        setSwaps({})
        setStoreName(null)
    }

    function handleZipUpdate() {
        if (!zipInput.trim()) return
        setZip(zipInput)
        refreshInventory(zipInput)
    }

    function handleSwitchStore(store: NearbyStore) {
        setZipInput(store.postalCode)
        setZip(store.postalCode)
        refreshInventory(store.postalCode)
    }

    function handleExport() {
        const rows = [
            ['SKU', 'Brand', 'Name', 'Qty', 'Unit Price', 'Total', 'In Stock', 'Store'],
            ...cartItems.map(({ product: p, qty }) => [
                p.itemId, p.brand ?? '', p.name ?? '', qty,
                p.price ?? '', p.price ? (p.price * qty).toFixed(2) : '',
                p.in_stock ? 'Yes' : 'No', p.store_name ?? '',
            ]),
        ]
        const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'cart.csv'
        a.click()
    }

    const oos = cartItems.filter(item => !item.product.in_stock && !swappedItems.has(item.product.itemId))
    const subtotal = cartItems.reduce((sum, { product: p, qty }) => sum + (p.price ?? 0) * qty, 0)
    const inStockCount = cartItems.filter(item => item.product.in_stock).length

    // Empty state
    if (cartItems.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 opacity-30" />
                <p className="text-sm font-medium">Your cart is empty</p>
                <p className="text-xs">Add items from the cost estimate page to get started.</p>
                <Button variant="outline" onClick={() => navigate('/plan')}>
                    Go to project planner
                </Button>
            </div>
        )
    }

    const grouped = {
        material: cartItems.filter(i => i.category === 'material'),
        tool: cartItems.filter(i => i.category === 'tool'),
        other: cartItems.filter(i => i.category === 'other'),
    }

    return (
        <div className="h-full flex flex-col gap-5 overflow-auto">

            {/* Page header */}
            <div className="flex items-center justify-between flex-shrink-0 pr-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">Cart</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleClearCart} className="text-red-500 hover:text-red-600 hover:border-red-300">
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear cart
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => refreshInventory(zip)} disabled={loading}>
                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Store bar */}
            <div className="flex items-center gap-3 bg-card border rounded-xl px-4 py-3 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">
                        {storeName ? `${storeName} — The Home Depot` : 'Resolving store…'}
                    </p>
                    <p className="text-xs text-muted-foreground">zip {zip}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Input
                        value={zipInput}
                        onChange={e => setZipInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleZipUpdate()}
                        placeholder="Change zip…"
                        className="w-28 h-8 text-xs"
                    />
                    <Button size="sm" className="h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white" onClick={handleZipUpdate}>
                        Update
                    </Button>
                </div>
            </div>

            {/* OOS alert */}
            {oos.length > 0 && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-700">
                        <span className="font-medium">{oos.length} item{oos.length > 1 ? 's are' : ' is'} out of stock</span> at {storeName ?? 'your store'}. Swap suggestions are shown below each item.
                    </p>
                </div>
            )}

            {/* Main grid */}
            <div className="grid grid-cols-[1fr_280px] gap-4 flex-1 min-h-0">

                {/* Left — cart items */}
                <div className="bg-card border rounded-xl overflow-auto">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Cart items</span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{cartItems.length}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">${subtotal.toFixed(2)}</span>
                    </div>

                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/40">
                                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 w-10"></th>
                                <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5">Product</th>
                                <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5">Availability</th>
                                <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5">Qty</th>
                                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(['material', 'tool', 'other'] as const)
                                .filter(cat => grouped[cat].length > 0)
                                .map(cat => (
                                    <>
                                        <tr key={`header-${cat}`} className="bg-muted/60">
                                            <td colSpan={5} className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                {cat === 'material' ? 'Materials' : cat === 'tool' ? 'Tools' : 'Other'}
                                            </td>
                                        </tr>
                                        {grouped[cat].map(({ product: p, qty }) => (
                                            <>
                                                <tr
                                                    key={p.itemId}
                                                    className={`border-b transition-colors ${!p.in_stock ? 'bg-red-50/40' : 'hover:bg-muted/30'}`}
                                                >
                                                    {/* Thumbnail */}
                                                    <td className="px-4 py-3">
                                                        <div className="w-9 h-9 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                                                            {p.image && <img src={p.image} alt="" className="w-full h-full object-cover" />}
                                                        </div>
                                                    </td>

                                                    {/* Name */}
                                                    <td className="px-3 py-3">
                                                        <a href={p.url ?? '#'} target="_blank" rel="noreferrer" className="text-xs font-medium leading-snug hover:text-orange-500 line-clamp-2">
                                                            {p.name}
                                                        </a>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">SKU {p.itemId}</p>
                                                    </td>

                                                    {/* Availability */}
                                                    <td className="px-3 py-3">
                                                        {loading
                                                            ? <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                                                            : <StockBadge product={p} />
                                                        }
                                                    </td>

                                                    {/* Qty */}
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => updateQty(p.itemId, -1)}
                                                                className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors"
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <span className="text-xs font-medium w-5 text-center">{qty}</span>
                                                            <button
                                                                onClick={() => updateQty(p.itemId, 1)}
                                                                className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => removeItem(p.itemId)}
                                                                className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors ml-1"
                                                            >
                                                                <XCircle className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {/* Cost */}
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`text-xs font-medium ${!p.in_stock ? 'text-muted-foreground' : ''}`}>
                                                            ${p.price ? (p.price * qty).toFixed(2) : 'Price unavailable'}
                                                        </span>
                                                    </td>
                                                </tr>

                                                {/* Swap row */}
                                                {!p.in_stock && swaps[p.itemId] && !swappedItems.has(p.itemId) && (
                                                    <tr key={`swap-${p.itemId}`} className="border-b bg-red-50/60">
                                                        <td colSpan={5} className="px-4 py-3">
                                                            <p className="text-[10px] font-medium text-red-600 mb-2 flex items-center gap-1">
                                                                <ArrowRightLeft className="w-3 h-3" />
                                                                Swap suggestion — in stock at {swaps[p.itemId].store_name ?? 'nearby store'}
                                                            </p>
                                                            <div className="flex items-center gap-3 bg-white border border-border rounded-lg px-3 py-2.5">
                                                                <div className="w-9 h-9 rounded bg-muted flex-shrink-0 overflow-hidden">
                                                                    {swaps[p.itemId].image && (
                                                                        <img src={swaps[p.itemId].image!} alt="" className="w-full h-full object-cover" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-medium line-clamp-1">{swaps[p.itemId].name}</p>
                                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                        {swaps[p.itemId].quantity} units available · {swaps[p.itemId].store_name}
                                                                    </p>
                                                                </div>
                                                                <span className="text-xs font-medium flex-shrink-0">${swaps[p.itemId].price?.toFixed(2)}</span>
                                                                <Button
                                                                    size="sm"
                                                                    className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
                                                                    onClick={() => applySwap(p.itemId)}
                                                                >
                                                                    Swap
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </>
                                ))
                            }
                        </tbody>
                    </table>
                </div>

                {/* Right — summary + nearby */}
                <div className="flex flex-col gap-3">

                    {/* Order summary */}
                    <div className="bg-card border rounded-xl p-4">
                        <p className="text-sm font-medium mb-3">Order summary</p>
                        <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex justify-between"><span>Subtotal ({cartItems.length} items)</span><span className="text-foreground font-medium">${subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>In stock at store</span><span className="text-green-700 font-medium">{inStockCount} items</span></div>
                            <div className="flex justify-between"><span>Out of stock</span><span className="text-red-600 font-medium">{cartItems.length - inStockCount} items</span></div>
                        </div>
                        <div className="border-t mt-3 pt-3 flex justify-between items-baseline">
                            <span className="text-sm font-medium">Estimated total</span>
                            <span className="text-base font-bold">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm h-9">
                                Proceed to checkout
                            </Button>
                            <Button variant="outline" className="w-full text-sm h-9">
                                Save project
                            </Button>
                        </div>
                    </div>

                    {/* Nearby stores */}
                    <div className="bg-card border rounded-xl p-4">
                        <p className="text-sm font-medium mb-3">Nearby store availability</p>
                        <div className="space-y-1">
                            {nearbyStores.map(store => (
                                <div key={store.storeId} className="flex items-center justify-between py-2 border-b last:border-b-0 text-xs">
                                    <div>
                                        <span className="font-medium text-foreground">{store.storeName}</span>
                                        {store.postalCode === zip && <span className="ml-1.5 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">current</span>}
                                        <p className="text-muted-foreground text-[10px]">{store.distance}</p>
                                    </div>
                                    <span className={`font-medium ${store.available === store.total ? 'text-green-700' : store.available! >= store.total! * 0.7 ? 'text-amber-600' : 'text-red-600'}`}>
                                        {store.available} / {store.total}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {nearbyStores.find(s => s.available === s.total && s.postalCode !== zip) && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-3 text-xs h-8"
                                onClick={() => {
                                    const best = nearbyStores.find(s => s.available === s.total && s.postalCode !== zip)
                                    if (best) handleSwitchStore(best)
                                }}
                            >
                                Switch to {nearbyStores.find(s => s.available === s.total && s.postalCode !== zip)?.storeName} → all items available
                            </Button>
                        )}
                    </div>

                    {/* Powered by */}
                    <p className="text-[10px] text-muted-foreground text-center">
                        Powered by AI. Inventory data refreshed live. Confirm before proceeding.
                    </p>

                </div>
            </div>
        </div>
    )
}
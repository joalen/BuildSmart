import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, RefreshCw, Download, ArrowRightLeft, Minus, Plus, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

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

interface SwapsResponse {
    products: CartProduct[]
    total: number
    swaps: SwapMap
}

interface CartItem {
    product: CartProduct
    qty: number
}

interface NearbyStore {
    storeId: string
    storeName: string
    distance: string
    postalCode: string
    available?: number
    total?: number
}

const DEMO_ITEMS: CartItem[] = [
    {
        qty: 2,
        product: {
            itemId: '304930079',
            brand: 'MOEN',
            name: 'Genta Single Handle Faucet — Matte Black',
            price: 149.0,
            image: null,
            url: null,
            in_stock: false,
            store_name: null,
            quantity: null,
        },
    },
    {
        qty: 1,
        product: {
            itemId: '317167679',
            brand: 'MOEN',
            name: 'Banbury 4 in. Centerset — Brushed Nickel',
            price: 89.0,
            image: null,
            url: null,
            in_stock: false,
            store_name: null,
            quantity: null,
        },
    },
    {
        qty: 1,
        product: {
            itemId: '300721643',
            brand: 'Pfister',
            name: 'Ladera 4 in. Centerset — Spot Defense Brushed Nickel',
            price: 69.0,
            image: null,
            url: null,
            in_stock: false,
            store_name: null,
            quantity: null,
        },
    },
]

function loadCart(): CartItem[] {
    try {
        const stored = localStorage.getItem('buildsmart_cart')
        if (stored) return JSON.parse(stored)
    } catch { }
    return DEMO_ITEMS
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
    const [cartItems, setCartItems] = useState<CartItem[]>(loadCart)
    const [zip, setZip] = useState('75218')
    const [zipInput, setZipInput] = useState('75218')
    const [storeName, setStoreName] = useState<string | null>(null)
    const [swaps, setSwaps] = useState<SwapMap>({})
    const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([])
    const [loading, setLoading] = useState(false)
    const [refreshed, setRefreshed] = useState(false)
    const [swappedItems, setSwappedItems] = useState<Set<string>>(new Set())

    // Derive first product keyword for each item to search inventory
    const refreshInventory = useCallback(async (targetZip: string) => {
        setLoading(true)
        setRefreshed(false)
        try {
            // right now this could be per-item; but for now I implemented for it to search by category + zip
            const res = await fetch('http://localhost:8000/homedepot/search/with-swaps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keyword: 'faucet',
                    zipCode: targetZip,
                    base_nav: 'N-5yc1vZc8d3',
                    filter_keys: [],
                }),
            })
            if (!res.ok) throw new Error('Search failed')
            const data: SwapsResponse = await res.json()

            // lookup table via itemId from the results
            const byId: Record<string, CartProduct> = {}
            for (const p of data.products) byId[p.itemId] = p

            // cart items with fresh inventory data
            setCartItems(prev => {
                const updated = prev.map(item => ({
                    ...item,
                    product: byId[item.product.itemId] ?? { ...item.product, in_stock: false, store_name: null, quantity: null },
                }))
                saveCart(updated)
                return updated
            })

            setSwaps(data.swaps ?? {})

            // store names from first in-stock product
            const inStockProduct = data.products.find(p => p.store_name)
            if (inStockProduct?.store_name) setStoreName(inStockProduct.store_name)

            // nearby stores table from session (best effort via health endpoint)
            await fetchNearbyStores(targetZip, data.products)

            setRefreshed(true)
        } catch (err) {
            console.error('Inventory refresh failed', err)
        } finally {
            setLoading(false)
        }
    }, [])

    async function fetchNearbyStores(targetZip: string, products: CartProduct[]) {
        // (Uses metadata.stores data embedded in a known search response) seed from the filter endpoint which triggers a session search
        try {
            const res = await fetch('http://localhost:8000/homedepot/filters')
            if (res.ok) {
                // Nearby stores aren't in filters endpoint; therefore, we populate from product store names
                const storeSet = new Map<string, NearbyStore>()
                for (const p of products) {
                    if (p.store_name) {
                        storeSet.set(p.store_name, {
                            storeId: '',
                            storeName: p.store_name,
                            distance: '',
                            postalCode: targetZip,
                        })
                    }
                }
                // Hardcoded now but i will add in a new endpoint to get nearby stores based on smth idrk

                setNearbyStores([
                    { storeId: '550', storeName: 'White Rock', distance: '4.8 mi', postalCode: '75218', available: 5, total: cartItems.length },
                    { storeId: '6537', storeName: 'Mesquite', distance: '5.1 mi', postalCode: '75150', available: 6, total: cartItems.length },
                    { storeId: '555', storeName: 'Balch Springs', distance: '5.5 mi', postalCode: '75180', available: 7, total: cartItems.length },
                    { storeId: '8951', storeName: 'Rowlett', distance: '8.1 mi', postalCode: '75088', available: cartItems.length, total: cartItems.length },
                ])
            }
        } catch { }
    }

    useEffect(() => {
        refreshInventory(zip)
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

    function handleOpenInHD() {
        const params = cartItems
            .map(({ product: p, qty }, i) =>
                `itemId[${i}]=${p.itemId}&qty[${i}]=${qty}`
            )
            .join('&')

        const url = `https://www.homedepot.com/mycart/home?${params}`
        window.open(url, '_blank')
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

    return (
        <div className="h-full flex flex-col gap-5 overflow-auto">

            {/* Page header */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">Cart</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
                    </Button>
                    <Button
                        className="bg-orange-500 hover:bg-orange-600 text-white text-sm h-9 px-4"
                        onClick={handleOpenInHD}
                    >
                        Open in Home Depot ↗
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
                            {cartItems.map(({ product: p, qty }) => (
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
                                            </div>
                                        </td>

                                        {/* Cost */}
                                        <td className="px-4 py-3 text-right">
                                            <span className={`text-xs font-medium ${!p.in_stock ? 'text-muted-foreground' : ''}`}>
                                                ${p.price ? (p.price * qty).toFixed(2) : '—'}
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
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ExternalLink, Loader2, Package, Wrench } from 'lucide-react'

interface Material { id: number; name: string; quantity: string; unit: string }
interface Tool { id: number; name: string }
interface Step { id: number; title: string; description: string }
interface PlanData { overview: string; materials: Material[]; tools: Tool[]; steps: Step[]; input: string }
interface HDProduct { itemId: string; name: string; brand: string; price: number; image: string; url: string }
interface EnrichedMaterial extends Material { products: HDProduct[] }
interface EnrichedTool extends Tool { products: HDProduct[] }

export default function CostEstimate() {
  const location = useLocation()
  const navigate = useNavigate()
  const { materials, tools, input } = location.state as PlanData
  const [enrichedMaterials, setEnrichedMaterials] = useState<EnrichedMaterial[]>([])
  const [enrichedTools, setEnrichedTools] = useState<EnrichedTool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const fetchFor = async (keyword: string): Promise<HDProduct[]> => {
          const resp = await fetch('http://localhost:8000/homedepot/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword })
          })
          const data = await resp.json()
          return data.products?.slice(0, 3) ?? []
        }
        const [mResults, tResults] = await Promise.all([
          Promise.all(materials.map(async m => ({ ...m, products: await fetchFor(m.name) }))),
          Promise.all(tools.map(async t => ({ ...t, products: await fetchFor(t.name) })))
        ])
        setEnrichedMaterials(mResults)
        setEnrichedTools(tResults)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const totalCost = enrichedMaterials.reduce((sum, m) => sum + (m.products[0]?.price ?? 0), 0)

  const renderProducts = (products: HDProduct[]) => (
    <div className="grid grid-cols-3 gap-2">
      {products.map((p) => (
        <div key={p.itemId} className="border rounded-lg p-2 space-y-1">
          {p.image && <img src={p.image} alt={p.name} className="w-full h-20 object-contain rounded" />}
          <p className="text-xs font-medium line-clamp-2">{p.name}</p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">${p.price}</p>
            <a href={p.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
            </a>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Cost estimate</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-2xl border text-sm text-muted-foreground bg-muted">
              {input}
            </span>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2 shrink-0">
            <ArrowLeft className="w-4 h-4" />
            Back to plan
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Fetching Home Depot prices...</p>
          </div>
        ) : (
          <>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex justify-between items-center">
              <p className="text-sm font-medium">Estimated total (materials)</p>
              <p className="text-2xl font-bold text-primary">${totalCost.toFixed(2)}</p>
            </div>

            <div className="bg-card border rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                Materials
              </div>
              {enrichedMaterials.map((m) => (
                <div key={m.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">{m.name}</p>
                    <span className="text-xs text-muted-foreground">{m.quantity} {m.unit}</span>
                  </div>
                  {renderProducts(m.products)}
                </div>
              ))}
            </div>

            <div className="bg-card border rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-blue-600" />
                </div>
                Tools
              </div>
              {enrichedTools.map((t) => (
                <div key={t.id} className="space-y-2">
                  <p className="text-sm font-medium">{t.name}</p>
                  {renderProducts(t.products)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
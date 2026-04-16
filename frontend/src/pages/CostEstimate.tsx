import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ExternalLink, Loader2, Package, Wrench, ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'


interface Material { id: number; name: string; quantity: string; unit: string }
interface Tool { id: number; name: string }
interface Step { id: number; title: string; description: string }
interface PlanData { overview: string; materials: Material[]; tools: Tool[]; steps: Step[]; input: string }
interface HDProduct { itemId: string; name: string; brand: string; price: number; image: string; url: string }
interface EnrichedMaterial extends Material { products: HDProduct[] }
interface EnrichedTool extends Tool { products: HDProduct[] }
interface Recommendation { item_id: string; category: string; score: number; name: string; price: number; image: string; url: string }

export default function CostEstimate() {
  const location = useLocation()
  const navigate = useNavigate()
  const { materials, tools, input } = location.state as PlanData
  const [enrichedMaterials, setEnrichedMaterials] = useState<EnrichedMaterial[]>([])
  const [enrichedTools, setEnrichedTools] = useState<EnrichedTool[]>([])
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [materialsOpen, setMaterialsOpen] = useState(true)
  const [toolsOpen, setToolsOpen] = useState(true)
  const [recsOpen, setRecsOpen] = useState(true)

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

        // recs 
        let recsData = []
        const searchOrder = [...mResults, ...tResults]
        for (const item of searchOrder) {
          for (const p of item.products) {
            if (!p.itemId) continue
            const recsResp = await fetch('http://localhost:8000/homedepot/recommendations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ item_id: p.itemId })
            })
            recsData = await recsResp.json()
            if (recsData.length > 0) break
          }
          if (recsData.length > 0) break
        }

        setRecs(recsData.slice(0, 12))

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
              <Collapsible open={materialsOpen} onOpenChange={setMaterialsOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full pb-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    Materials
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                  {enrichedMaterials.map((m) => (
                    <div key={m.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">{m.name}</p>
                        <span className="text-xs text-muted-foreground">{m.quantity} {m.unit}</span>
                      </div>
                      {renderProducts(m.products)}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="bg-card border rounded-xl p-4 space-y-4">
              <Collapsible open={toolsOpen} onOpenChange={setToolsOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full pb-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-blue-600" />
                    </div>
                    Tools
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                  {enrichedTools.map((t) => (
                    <div key={t.id} className="space-y-2">
                      <p className="text-sm font-medium">{t.name}</p>
                      {renderProducts(t.products)}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>

            {recs.length > 0 && (
              <div className="bg-card border rounded-xl p-4 space-y-4">
                <Collapsible open={recsOpen} onOpenChange={setRecsOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full pb-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                        <Package className="w-4 h-4 text-green-600" />
                      </div>
                      Also frequently needed
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">based on similar projects</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${recsOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <Carousel opts={{ align: 'start' }}>
                      <CarouselContent>
                        {recs.map((r) => (
                          <CarouselItem key={r.item_id} className="basis-1/3">
                            <div className="border rounded-lg p-2 space-y-1">
                              {r.image && <img src={r.image} alt={r.name} className="w-full h-20 object-contain rounded" />}
                              <p className="text-xs text-muted-foreground">{r.category}</p>
                              <p className="text-xs font-medium line-clamp-2">{r.name}</p>
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-bold">${r.price}</p>
                                <a href={r.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
                                </a>
                              </div>
                              <div className="text-xs text-green-600 font-medium">{Math.round(r.score)}% of similar projects</div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-0" />
                      <CarouselNext className="right-0" />
                    </Carousel>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
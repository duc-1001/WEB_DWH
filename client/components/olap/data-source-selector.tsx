'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Database, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

interface DataSource {
  id: string
  name: string
  type: string
  tables: string[]
}

interface DataSourceSelectorProps {
  onSelect: (source: DataSource, table: string) => void
}

export function DataSourceSelector({ onSelect }: DataSourceSelectorProps) {
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null)
  const [sources, setSources] = useState<DataSource[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadSources = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/data-sources', { cache: 'no-store' })
        const sourcesPayload = await response.json()

        const cubeResponse = await fetch('/api/cube/meta', { cache: 'no-store' })
        const cubePayload = await cubeResponse.json()

        const dimensions = Array.isArray(cubePayload?.dimensions)
          ? cubePayload.dimensions.map((dimension: { name: string }) => dimension.name)
          : []
        const measures = Array.isArray(cubePayload?.measures)
          ? cubePayload.measures.map((measure: { name: string }) => measure.name)
          : []

        const tables = [...new Set([...dimensions, ...measures])].filter(Boolean)

        if (isMounted) {
          const baseSource = sourcesPayload?.data?.[0]
          setSources([
            {
              id: baseSource?.id || 'cube-main',
              name: baseSource?.name || 'OLAP Cube Server',
              type: baseSource?.type || 'OLAP',
              tables: tables.length > 0 ? tables : ['Default Measure'],
            },
          ])
        }
      } catch (_err) {
        if (isMounted) {
          setSources([
            {
              id: 'fallback',
              name: 'OLAP Cube (Fallback)',
              type: 'OLAP',
              tables: ['orders', 'products', 'customers', 'regions'],
            },
          ])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSources()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSelectTable = (source: DataSource, table: string) => {
    onSelect(source, table)
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-card border-border/50 hover:border-border transition-colors">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded">
            <Database className="h-5 w-5 text-primary" />
          </div>
          Data Source
        </h3>

        {!selectedSource ? (
          <div className="space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Loading sources...</p>}
            {sources.map((source) => (
              <Button
                key={source.id}
                variant="outline"
                onClick={() => setSelectedSource(source)}
                className="w-full justify-start gap-3 text-left h-auto py-3"
              >
                <Database className="h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{source.name}</p>
                  <p className="text-xs text-muted-foreground">{source.type}</p>
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedSource(null)
                setSearch('')
              }}
              className="text-primary hover:text-primary"
            >
              ← Back to Sources
            </Button>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{selectedSource.name}</p>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tables..."
                  className="pl-9 bg-input border-border text-foreground"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedSource.tables
                .filter((t) => t.toLowerCase().includes(search.toLowerCase()))
                .map((table) => (
                  <Button
                    key={table}
                    onClick={() => handleSelectTable(selectedSource, table)}
                    variant="outline"
                    className="w-full justify-start text-foreground hover:bg-accent"
                  >
                    {table}
                  </Button>
                ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

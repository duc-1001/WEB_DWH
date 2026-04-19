'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, ChevronDown } from 'lucide-react'

interface DimensionItem {
  id: string
  name: string
  type: 'dimension' | 'hierarchy' | 'level'
  children?: DimensionItem[]
}

const DIMENSIONS_HIERARCHY: DimensionItem[] = [
  {
    id: 'time',
    name: 'Time Dimension',
    type: 'dimension',
    children: [
      { id: 'time-year', name: 'Year', type: 'level' },
      { id: 'time-quarter', name: 'Quarter', type: 'level' },
      { id: 'time-month', name: 'Month', type: 'level' },
      { id: 'time-week', name: 'Week', type: 'level' },
      { id: 'time-day', name: 'Day', type: 'level' },
    ]
  },
  {
    id: 'geography',
    name: 'Geography Dimension',
    type: 'dimension',
    children: [
      { id: 'geo-country', name: 'Country', type: 'level' },
      { id: 'geo-region', name: 'Region', type: 'level' },
      { id: 'geo-city', name: 'City', type: 'level' },
      { id: 'geo-store', name: 'Store', type: 'level' },
    ]
  },
  {
    id: 'product',
    name: 'Product Dimension',
    type: 'dimension',
    children: [
      { id: 'prod-category', name: 'Category', type: 'level' },
      { id: 'prod-subcategory', name: 'Subcategory', type: 'level' },
      { id: 'prod-sku', name: 'SKU', type: 'level' },
    ]
  },
  {
    id: 'customer',
    name: 'Customer Dimension',
    type: 'dimension',
    children: [
      { id: 'cust-segment', name: 'Segment', type: 'level' },
      { id: 'cust-group', name: 'Customer Group', type: 'level' },
      { id: 'cust-individual', name: 'Individual Customer', type: 'level' },
    ]
  },
]

interface DimensionNavigatorProps {
  onSelectDimension?: (dimension: DimensionItem) => void
}

export function DimensionNavigator({ onSelectDimension }: DimensionNavigatorProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['time', 'geography']))

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpanded(newExpanded)
  }

  const renderItem = (item: DimensionItem, level = 0) => (
    <div key={item.id} className={level > 0 ? 'ml-4' : ''}>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded hover:bg-muted cursor-pointer transition-colors"
        onClick={() => {
          if (item.children?.length) {
            toggleExpand(item.id)
          }
          onSelectDimension?.(item)
        }}
      >
        {item.children?.length ? (
          expanded.has(item.id) ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )
        ) : (
          <div className="h-4 w-4" />
        )}
        <span className={`text-sm ${item.type === 'dimension' ? 'font-semibold' : ''} text-foreground`}>
          {item.name}
        </span>
        {item.type === 'level' && (
          <Badge variant="outline" className="ml-auto text-xs">Level</Badge>
        )}
      </div>
      {item.children && expanded.has(item.id) && (
        <div>
          {item.children.map(child => renderItem(child, level + 1))}
        </div>
      )}
    </div>
  )

  return (
    <Card className="h-full border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🔗 Dimensions
        </CardTitle>
        <CardDescription className="text-xs">Explore your data dimensions and hierarchy</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {DIMENSIONS_HIERARCHY.map(item => renderItem(item))}
        </div>
      </CardContent>
    </Card>
  )
}

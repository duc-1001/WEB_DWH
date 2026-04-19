'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface MetadataItem {
  name: string
  type: 'dimension' | 'measure'
  description: string
  format?: string
}

const DATA_METADATA: MetadataItem[] = [
  // Dimensions
  { name: 'Region', type: 'dimension', description: 'Geographic region (North, South, East, West)' },
  { name: 'Quarter', type: 'dimension', description: 'Quarter of the year (Q1-Q4)' },
  { name: 'Year', type: 'dimension', description: 'Calendar year for the transaction' },
  { name: 'Product Category', type: 'dimension', description: 'Main product category classification' },
  { name: 'Customer Segment', type: 'dimension', description: 'Customer classification (Premium, Standard, Basic)' },
  { name: 'Customer Key', type: 'dimension', description: 'Unique identifier for the customer' },
  // Measures
  { name: 'Sales', type: 'measure', description: 'Total sales revenue', format: 'Currency ($)' },
  { name: 'Orders', type: 'measure', description: 'Number of orders placed', format: 'Integer' },
  { name: 'Customers', type: 'measure', description: 'Number of unique customers', format: 'Integer' },
  { name: 'Profit Margin', type: 'measure', description: 'Profit margin percentage', format: 'Percentage (%)' },
  { name: 'Average Order Value', type: 'measure', description: 'Mean value per order', format: 'Currency ($)' },
]

export function DataDictionary() {
  const [expandedType, setExpandedType] = useState<'dimension' | 'measure' | null>('dimension')

  const toggleType = (type: 'dimension' | 'measure') => {
    setExpandedType(expandedType === type ? null : type)
  }

  const dimensions = DATA_METADATA.filter(item => item.type === 'dimension')
  const measures = DATA_METADATA.filter(item => item.type === 'measure')

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          📖 Data Dictionary
        </CardTitle>
        <CardDescription className="text-xs">Field definitions and metadata reference</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dimensions */}
        <div>
          <button
            onClick={() => toggleType('dimension')}
            className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted transition-colors"
          >
            {expandedType === 'dimension' ? (
              <ChevronDown className="h-4 w-4 text-primary" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-semibold text-foreground">Dimensions ({dimensions.length})</span>
          </button>
          {expandedType === 'dimension' && (
            <div className="space-y-2 mt-2 ml-4">
              {dimensions.map((item, idx) => (
                <div key={idx} className="p-2 bg-muted/50 rounded text-sm">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Measures */}
        <div className="pt-2 border-t border-border">
          <button
            onClick={() => toggleType('measure')}
            className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted transition-colors"
          >
            {expandedType === 'measure' ? (
              <ChevronDown className="h-4 w-4 text-primary" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-semibold text-foreground">Measures ({measures.length})</span>
          </button>
          {expandedType === 'measure' && (
            <div className="space-y-2 mt-2 ml-4">
              {measures.map((item, idx) => (
                <div key={idx} className="p-2 bg-muted/50 rounded text-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    </div>
                    {item.format && (
                      <Badge variant="outline" className="text-xs ml-2">{item.format}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

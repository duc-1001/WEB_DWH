'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Filter {
  id: string
  dimension: string
  operator: 'equals' | 'contains' | 'range'
  values: string[]
}

const FILTER_OPTIONS = {
  'Time Period': ['2024', '2023', 'Q1', 'Q2', 'Q3', 'Q4'],
  'Region': ['North', 'South', 'East', 'West'],
  'Category': ['Electronics', 'Clothing', 'Food', 'Home'],
  'Customer Segment': ['Premium', 'Standard', 'Basic', 'VIP'],
}

export function FilterControls() {
  const [filters, setFilters] = useState<Filter[]>([
    { id: '1', dimension: 'Time Period', operator: 'equals', values: ['2024'] }
  ])
  const [newFilterDimension, setNewFilterDimension] = useState('Region')

  const addFilter = () => {
    const newFilter: Filter = {
      id: Date.now().toString(),
      dimension: newFilterDimension,
      operator: 'equals',
      values: []
    }
    setFilters([...filters, newFilter])
  }

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id))
  }

  const updateFilter = (id: string, values: string[]) => {
    setFilters(filters.map(f => f.id === id ? { ...f, values } : f))
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🔍 Global Filters
        </CardTitle>
        <CardDescription>Slice data across dimensions to focus your analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Filters */}
        <div className="space-y-2">
          {filters.map(filter => (
            <div key={filter.id} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{filter.dimension}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {filter.values.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No filters applied</span>
                  ) : (
                    filter.values.map((val, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {val}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter(filter.id)}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add New Filter */}
        <div className="space-y-2 pt-2 border-t border-border">
          <label className="text-sm font-medium text-foreground block">Add Filter</label>
          <div className="flex gap-2">
            <Select value={newFilterDimension} onValueChange={setNewFilterDimension}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(FILTER_OPTIONS).map(dim => (
                  <SelectItem key={dim} value={dim}>
                    {dim}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={addFilter} className="gap-2">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        {/* Quick Filter Selection */}
        {newFilterDimension && FILTER_OPTIONS[newFilterDimension as keyof typeof FILTER_OPTIONS] && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Quick select for {newFilterDimension}:</p>
            <div className="flex gap-1 flex-wrap">
              {FILTER_OPTIONS[newFilterDimension as keyof typeof FILTER_OPTIONS].map(val => (
                <Badge
                  key={val}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent transition-colors text-xs"
                  onClick={() => updateFilter(filters[filters.length - 1]?.id || filters[0]?.id, [val])}
                >
                  {val}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

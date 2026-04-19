'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bookmark, Trash2, Download } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface SavedView {
  id: string
  name: string
  description: string
  config: {
    rows: string[]
    columns: string[]
    measures: string[]
    filters: Record<string, string[]>
  }
  createdAt: string
  lastModified: string
}

const MOCK_SAVED_VIEWS: SavedView[] = [
  {
    id: '1',
    name: 'Regional Sales Analysis',
    description: 'Sales by region and quarter with filters for 2024',
    config: {
      rows: ['Region'],
      columns: ['Quarter'],
      measures: ['Sales'],
      filters: { 'Year': ['2024'] }
    },
    createdAt: '2024-03-15',
    lastModified: '2024-03-18'
  },
  {
    id: '2',
    name: 'Product Performance',
    description: 'Sales and orders by product category',
    config: {
      rows: ['Product Category'],
      columns: ['Quarter'],
      measures: ['Sales', 'Orders'],
      filters: {}
    },
    createdAt: '2024-03-10',
    lastModified: '2024-03-17'
  },
  {
    id: '3',
    name: 'Customer Segment Trends',
    description: 'Customer count and average order value by segment',
    config: {
      rows: ['Customer Segment'],
      columns: ['Year'],
      measures: ['Customers', 'Average Order Value'],
      filters: {}
    },
    createdAt: '2024-03-05',
    lastModified: '2024-03-16'
  },
]

interface SavedViewsProps {
  onLoadView?: (view: SavedView) => void
}

export function SavedViews({ onLoadView }: SavedViewsProps) {
  const [views, setViews] = useState<SavedView[]>(MOCK_SAVED_VIEWS)
  const [newViewName, setNewViewName] = useState('')
  const [newViewDesc, setNewViewDesc] = useState('')

  const deleteView = (id: string) => {
    setViews(views.filter(v => v.id !== id))
  }

  const saveNewView = () => {
    if (newViewName.trim()) {
      const newView: SavedView = {
        id: Date.now().toString(),
        name: newViewName,
        description: newViewDesc,
        config: {
          rows: ['Region'],
          columns: ['Quarter'],
          measures: ['Sales'],
          filters: {}
        },
        createdAt: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0]
      }
      setViews([newView, ...views])
      setNewViewName('')
      setNewViewDesc('')
    }
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-primary" />
              Saved Views
            </CardTitle>
            <CardDescription className="text-xs mt-1">Quick access to saved configurations</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">Save Current View</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Current Configuration</DialogTitle>
                <DialogDescription>
                  Save your current pivot table setup for quick access later
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">View Name</label>
                  <Input
                    placeholder="e.g., Monthly Sales Report"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Description</label>
                  <Input
                    placeholder="Optional description"
                    value={newViewDesc}
                    onChange={(e) => setNewViewDesc(e.target.value)}
                  />
                </div>
                <Button onClick={saveNewView} className="w-full">Save View</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {views.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No saved views yet</p>
          ) : (
            views.map(view => (
              <div key={view.id} className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => onLoadView?.(view)}>
                    <p className="font-medium text-foreground text-sm">{view.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{view.description}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {view.config.rows.map(r => (
                        <Badge key={`r-${r}`} variant="outline" className="text-xs">
                          Row: {r}
                        </Badge>
                      ))}
                      {view.config.columns.map(c => (
                        <Badge key={`c-${c}`} variant="outline" className="text-xs">
                          Col: {c}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Modified: {new Date(view.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteView(view.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

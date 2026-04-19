'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { BarChart3, LineChart, PieChart, Grid3x3, AreaChart, ScatterChart } from 'lucide-react'

export interface QuickChartBuilderProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onCreateChart?: (chart: {
    title: string
    type: string
    description?: string
  }) => void
}

const CHART_TYPES = [
  { type: 'bar', label: 'Bar Chart', icon: <BarChart3 className="h-5 w-5" /> },
  { type: 'line', label: 'Line Chart', icon: <LineChart className="h-5 w-5" /> },
  { type: 'pie', label: 'Pie Chart', icon: <PieChart className="h-5 w-5" /> },
  { type: 'area', label: 'Area Chart', icon: <AreaChart className="h-5 w-5" /> },
  { type: 'scatter', label: 'Scatter Plot', icon: <ScatterChart className="h-5 w-5" /> },
  { type: 'heatmap', label: 'Heat Map', icon: <Grid3x3 className="h-5 w-5" /> },
]

export function QuickChartBuilder({ open = false, onOpenChange, onCreateChart }: QuickChartBuilderProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedType, setSelectedType] = useState<string>('bar')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!title.trim()) {
      alert('Please enter a chart title')
      return
    }

    setIsCreating(true)
    try {
      onCreateChart?.({
        title,
        type: selectedType,
        description: description || undefined,
      })

      // Reset form
      setTitle('')
      setDescription('')
      setSelectedType('bar')
      onOpenChange?.(false)
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isCreating) {
      onOpenChange?.(newOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Chart to Dashboard</DialogTitle>
          <DialogDescription>
            Create a new chart quickly. You can configure data and dimensions after adding it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Chart Title */}
          <div className="space-y-2">
            <Label htmlFor="chart-title">Chart Title *</Label>
            <Input
              id="chart-title"
              placeholder="e.g., Sales by Region"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isCreating}
            />
          </div>

          {/* Chart Description */}
          <div className="space-y-2">
            <Label htmlFor="chart-description">Description (Optional)</Label>
            <Input
              id="chart-description"
              placeholder="Brief description of the chart"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isCreating}
            />
          </div>

          {/* Chart Type Selection */}
          <div className="space-y-3">
            <Label>Chart Type *</Label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {CHART_TYPES.map((chartType) => (
                <Card
                  key={chartType.type}
                  className={`p-4 cursor-pointer transition-all border-2 flex flex-col items-center gap-2 ${
                    selectedType === chartType.type
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-border'
                  }`}
                  onClick={() => !isCreating && setSelectedType(chartType.type)}
                >
                  <div className={selectedType === chartType.type ? 'text-primary' : 'text-muted-foreground'}>
                    {chartType.icon}
                  </div>
                  <span className="text-xs text-center font-medium">{chartType.label}</span>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !title.trim()}>
            {isCreating ? 'Creating...' : 'Create Chart'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

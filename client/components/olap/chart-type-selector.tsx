'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BarChart3, LineChart, PieChart, Grid3x3, AreaChart, ScatterChart } from 'lucide-react'

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'heatmap'

interface ChartTypeSelectorProps {
  selected: ChartType
  onSelect: (type: ChartType) => void
}

const CHART_TYPES: { type: ChartType; label: string; icon: React.ReactNode }[] = [
  { type: 'bar', label: 'Bar Chart', icon: <BarChart3 className="h-5 w-5" /> },
  { type: 'line', label: 'Line Chart', icon: <LineChart className="h-5 w-5" /> },
  { type: 'area', label: 'Area Chart', icon: <AreaChart className="h-5 w-5" /> },
  { type: 'pie', label: 'Pie Chart', icon: <PieChart className="h-5 w-5" /> },
  { type: 'scatter', label: 'Scatter Plot', icon: <ScatterChart className="h-5 w-5" /> },
  { type: 'heatmap', label: 'Heat Map', icon: <Grid3x3 className="h-5 w-5" /> },
]

export function ChartTypeSelector({ selected, onSelect }: ChartTypeSelectorProps) {
  return (
    <Card className="p-6 bg-card border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span>📊</span>
        Choose Chart Type
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {CHART_TYPES.map((chart) => (
          <Button
            key={chart.type}
            onClick={() => onSelect(chart.type)}
            variant={selected === chart.type ? 'default' : 'outline'}
            className="h-auto flex-col gap-2 py-4 text-sm"
          >
            {chart.icon}
            {chart.label}
          </Button>
        ))}
      </div>
    </Card>
  )
}

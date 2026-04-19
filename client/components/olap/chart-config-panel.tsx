'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'

interface ChartConfigPanelProps {
  chartName: string
  onNameChange: (name: string) => void
  xAxis: string
  onXAxisChange: (axis: string) => void
  yAxis: string
  onYAxisChange: (axis: string) => void
  metrics: string[]
  onMetricsChange: (metrics: string[]) => void
  dimensions: string[]
  onDimensionsChange: (dimensions: string[]) => void
  filters: Array<{ field: string; operator: string; value: string }>
  onAddFilter: () => void
  onRemoveFilter: (index: number) => void
  onFilterChange: (index: number, field: string, value: any) => void
  availableColumns: string[]
  availableMetrics?: string[]
}

export function ChartConfigPanel({
  chartName,
  onNameChange,
  xAxis,
  onXAxisChange,
  yAxis,
  onYAxisChange,
  metrics,
  onMetricsChange,
  dimensions,
  onDimensionsChange,
  filters,
  onAddFilter,
  onRemoveFilter,
  onFilterChange,
  availableColumns,
  availableMetrics,
}: ChartConfigPanelProps) {
  const metricOptions = availableMetrics && availableMetrics.length > 0 ? availableMetrics : availableColumns

  const handleAddMetric = (column: string) => {
    if (!metrics.includes(column)) {
      onMetricsChange([...metrics, column])
    }
  }

  const handleRemoveMetric = (column: string) => {
    onMetricsChange(metrics.filter((m) => m !== column))
  }

  return (
    <Card className="p-6 bg-card border-border/50 space-y-6">
      {/* Chart Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Chart Title</label>
        <Input
          placeholder="Enter chart name..."
          value={chartName}
          onChange={(e) => onNameChange(e.target.value)}
          className="bg-input border-border text-foreground"
        />
      </div>

      {/* X-Axis Configuration */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">X-Axis</label>
        <Select value={xAxis} onValueChange={onXAxisChange}>
          <SelectTrigger className="bg-input border-border text-foreground">
            <SelectValue placeholder="Select X-axis column" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {availableColumns.map((col) => (
              <SelectItem key={col} value={col}>
                {col}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Y-Axis Configuration */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Y-Axis</label>
        <Select value={yAxis} onValueChange={onYAxisChange}>
          <SelectTrigger className="bg-input border-border text-foreground">
            <SelectValue placeholder="Select Y-axis column" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {metricOptions.map((col) => (
              <SelectItem key={col} value={col}>
                {col}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Configuration */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Metrics</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {metrics.map((metric) => (
            <Badge key={metric} variant="default" className="gap-1">
              {metric}
              <button onClick={() => handleRemoveMetric(metric)} className="ml-1 hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Select onValueChange={handleAddMetric}>
          <SelectTrigger className="bg-input border-border text-foreground">
            <SelectValue placeholder="Add metric..." />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {metricOptions
              .filter((col) => !metrics.includes(col))
              .map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Filters</label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filters.map((filter, index) => (
            <div key={index} className="flex gap-2 items-start">
              <Select
                value={filter.field}
                onValueChange={(value) => onFilterChange(index, 'field', value)}
              >
                <SelectTrigger className="bg-input border-border text-foreground text-sm flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveFilter(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          onClick={onAddFilter}
          variant="outline"
          size="sm"
          className="w-full gap-2 text-foreground hover:bg-accent"
        >
          <Plus className="h-4 w-4" />
          Add Filter
        </Button>
      </div>

      {/* Chart Options */}
      <div className="space-y-3 border-t border-border pt-4">
        <h4 className="text-sm font-medium text-foreground">Chart Options</h4>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            Show Legend
          </label>
          <label className="text-xs text-muted-foreground flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            Show Grid
          </label>
          <label className="text-xs text-muted-foreground flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded" />
            Show Labels
          </label>
        </div>
      </div>
    </Card>
  )
}

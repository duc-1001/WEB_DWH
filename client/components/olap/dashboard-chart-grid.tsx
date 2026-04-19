'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChartCard } from './chart-card'
import { Plus, GripVertical } from 'lucide-react'
import { Empty } from '@/components/ui/empty'

export interface DashboardChart {
  id: string
  title: string
  description?: string
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'heatmap'
  data: any[]
  xField?: string
  yField?: string
}

export interface DashboardChartGridProps {
  charts: DashboardChart[]
  isEditing?: boolean
  onAddChart?: () => void
  onEditChart?: (id: string) => void
  onDeleteChart?: (id: string) => void
  onExportChart?: (id: string) => void
  onSelectChart?: (id: string) => void
  selectedCharts?: string[]
}

export function DashboardChartGrid({
  charts,
  isEditing = false,
  onAddChart,
  onEditChart,
  onDeleteChart,
  onExportChart,
  onSelectChart,
  selectedCharts = [],
}: DashboardChartGridProps) {
  const [draggedChart, setDraggedChart] = useState<string | null>(null)

  const handleDragStart = (id: string) => {
    if (isEditing) {
      setDraggedChart(id)
    }
  }

  const handleDragEnd = () => {
    setDraggedChart(null)
  }

  if (charts.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Charts
            </CardTitle>
            <CardDescription>Add charts to your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Empty
              title="No charts yet"
              description="Create your first chart to get started"
              action={
                onAddChart && (
                  <Button onClick={onAddChart} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Chart
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              📊 Charts ({charts.length})
            </CardTitle>
            <CardDescription>
              {isEditing ? 'Edit your dashboard charts' : 'View dashboard charts'}
            </CardDescription>
          </div>
          {isEditing && onAddChart && (
            <Button onClick={onAddChart} className="gap-2" size="sm">
              <Plus className="h-4 w-4" />
              Add Chart
            </Button>
          )}
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {charts.map((chart) => (
              <div
                key={chart.id}
                draggable={isEditing}
                onDragStart={() => handleDragStart(chart.id)}
                onDragEnd={handleDragEnd}
                className={`relative ${isEditing ? 'cursor-move' : ''} ${
                  draggedChart === chart.id ? 'opacity-50' : ''
                }`}
              >
                {isEditing && (
                  <div className="absolute -left-2 top-2 z-10 text-muted-foreground opacity-0 hover:opacity-100 transition-opacity">
                    <GripVertical className="h-5 w-5" />
                  </div>
                )}
                <ChartCard
                  {...chart}
                  isSelected={selectedCharts.includes(chart.id)}
                  onSelect={onSelectChart}
                  onEdit={onEditChart}
                  onDelete={onDeleteChart}
                  onExport={onExportChart}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

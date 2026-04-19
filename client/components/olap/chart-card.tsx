'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Download } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

export interface ChartCardProps {
  id: string
  title: string
  description?: string
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'heatmap'
  data: any[]
  xField?: string
  yField?: string
  isSelected?: boolean
  onSelect?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onExport?: (id: string) => void
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export function ChartCard({
  id,
  title,
  description,
  type,
  data,
  xField,
  yField,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onExport,
}: ChartCardProps) {
  const handleChartClick = () => {
    if (onSelect) {
      onSelect(id)
    }
  }

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          No data available
        </div>
      )
    }

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xField || 'name'} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={yField || 'value'} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xField || 'name'} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={yField || 'value'} stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey={yField || 'value'}
                nameKey={xField || 'name'}
                cx="50%"
                cy="50%"
                outerRadius={60}
                label
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xField || 'name'} />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey={yField || 'value'} fill="#3b82f6" />
            </AreaChart>
          </ResponsiveContainer>
        )
      default:
        return (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Chart type not supported
          </div>
        )
    }
  }

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-lg cursor-pointer border-border/50 bg-card/50 ${
        isSelected ? 'ring-2 ring-primary border-primary' : ''
      }`}
      onClick={handleChartClick}
    >
      {/* Chart Preview */}
      <div className="bg-background/50 p-4">
        {renderChart()}
      </div>

      {/* Chart Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-1">{title}</h3>
        {description && <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-1 bg-primary/10 text-primary rounded">
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2 border-t border-border/30">
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 gap-2 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            onEdit?.(id)
          }}
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 gap-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation()
            onExport?.(id)
          }}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 gap-2 text-xs text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.(id)
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </Card>
  )
}

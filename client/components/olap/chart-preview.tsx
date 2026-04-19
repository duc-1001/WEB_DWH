'use client'

import { Card } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, AreaChart, Area } from 'recharts'
import { ChartType } from './chart-type-selector'

interface ChartPreviewProps {
  type: ChartType
  chartName: string
  data: any[]
  xAxis: string
  yAxis: string
  metrics: string[]
  isLoading?: boolean
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8f5cf6']
const GRID_COLOR = '#cbd5e1'
const AXIS_COLOR = '#64748b'
const TOOLTIP_STYLE = { backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }

export function ChartPreview({
  type,
  chartName,
  data,
  xAxis,
  yAxis,
  metrics,
  isLoading,
}: ChartPreviewProps) {
  if (isLoading) {
    return (
      <Card className="p-8 bg-card border-border flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating preview...</p>
        </div>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-8 bg-card border-dashed border-border flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-muted-foreground font-medium">No data to display</p>
          <p className="text-sm text-muted-foreground">Configure data source and metrics to preview chart</p>
        </div>
      </Card>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey={xAxis} stroke={AXIS_COLOR} />
              <YAxis stroke={AXIS_COLOR} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              {metrics.map((metric, index) => (
                <Bar key={metric} dataKey={metric} fill={COLORS[index % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey={xAxis} stroke={AXIS_COLOR} />
              <YAxis stroke={AXIS_COLOR} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              {metrics.map((metric, index) => (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey={xAxis} stroke={AXIS_COLOR} />
              <YAxis stroke={AXIS_COLOR} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              {metrics.map((metric, index) => (
                <Area
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  fill={COLORS[index % COLORS.length]}
                  stroke={COLORS[index % COLORS.length]}
                  opacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data}
                dataKey={metrics[0] || yAxis}
                nameKey={xAxis}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis type="number" dataKey={xAxis} stroke={AXIS_COLOR} />
              <YAxis type="number" dataKey={yAxis} stroke={AXIS_COLOR} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              {metrics.map((metric, index) => (
                <Scatter
                  key={metric}
                  name={metric}
                  data={data}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        )

      case 'heatmap':
        // Simple heatmap using bars with color intensity
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis type="number" stroke={AXIS_COLOR} />
              <YAxis type="category" dataKey={xAxis} stroke={AXIS_COLOR} width={100} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              {metrics.map((metric, index) => (
                <Bar key={metric} dataKey={metric} fill={COLORS[index % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{chartName || 'Chart Preview'}</h3>
        <p className="text-sm text-muted-foreground mt-1">{type.toUpperCase()}</p>
      </div>
      {renderChart()}
    </Card>
  )
}

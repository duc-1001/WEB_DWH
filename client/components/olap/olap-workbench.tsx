'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownUp,
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  RefreshCw,
  RotateCcw,
  Save,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type CubeMetaDimension = {
  name: string
  hierarchy: string[]
  hierarchyUniqueName: string
}

type CubeMetaMeasure = {
  name: string
  uniqueName: string
}

type CubeMetaResponse = {
  dimensions: CubeMetaDimension[]
  measures: CubeMetaMeasure[]
}

type CubeRow = {
  dimensions: Record<string, string>
  measures: Record<string, number>
}

type CubeQueryResponse = {
  rows: CubeRow[]
  selectedDimensions: string[]
  selectedMeasures: string[]
  levels: Record<string, number>
  error?: string
}

type SavedReport = {
  id: string
  dashboardId: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  config: {
    selectedDimensions: string[]
    currentLevels: Record<string, number>
    selectedMeasures: string[]
    filters: Record<string, string[]>
    rowDimension: string
    columnDimension: string
    chartType: 'line' | 'bar' | 'heatmap'
  }
}

type ChartPoint = {
  name: string
  value: number
}

const CHART_COLORS = ['#3b82f6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const DIMENSION_DESCRIPTION: Record<string, string> = {
  'DIM CUSTOMER': 'Analyze customer behavior by location, type, and identity.',
  'DIM PRODUCT': 'Analyze product performance by attributes and category.',
  'DIM STORE': 'Analyze store/channel performance by geography and location.',
  'Dim Time': 'Analyze trend by year, quarter, month, and day.',
}

const MEASURE_DESCRIPTION: Record<string, string> = {
  'Fact Inventory Count': 'Count of inventory fact records.',
  'Quantity On Hand': 'Current stock quantity.',
  'Fact Sales Count': 'Count of sales transactions.',
  'Quantity Ordered': 'Total ordered quantity.',
  'Total Amount': 'Total sales amount.',
}

interface OlapWorkbenchProps {
  dashboardId: string
}

function formatMeasure(value: number, measure: string) {
  if (measure.toLowerCase().includes('amount')) {
    return `$${value.toLocaleString()}`
  }
  return value.toLocaleString()
}

export function OlapWorkbench({ dashboardId }: OlapWorkbenchProps) {
  const [meta, setMeta] = useState<CubeMetaResponse | null>(null)
  const [data, setData] = useState<CubeRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([])
  const [currentLevels, setCurrentLevels] = useState<Record<string, number>>({})
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>([])
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [enabledFilterDimensions, setEnabledFilterDimensions] = useState<string[]>([])

  const [rowDimension, setRowDimension] = useState('')
  const [columnDimension, setColumnDimension] = useState('')
  const [chartType, setChartType] = useState<'line' | 'bar' | 'heatmap'>('line')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [visibleRows, setVisibleRows] = useState(50)

  const [reports, setReports] = useState<SavedReport[]>([])
  const [newReportName, setNewReportName] = useState('')

  const primaryMeasure = selectedMeasures[0] || ''

  const loadMeta = async () => {
    const response = await fetch('/api/cube/meta', { cache: 'no-store' })
    const payload: CubeMetaResponse = await response.json()

    if (!response.ok) {
      throw new Error('Unable to load cube metadata.')
    }

    const dimensions = Array.isArray(payload.dimensions) ? payload.dimensions : []
    const measures = Array.isArray(payload.measures) ? payload.measures : []

    setMeta({ dimensions, measures })

    if (dimensions.length > 0) {
      const initialDims = dimensions.slice(0, 2).map((item) => item.name)
      setSelectedDimensions(initialDims)
      setRowDimension(initialDims[0] || '')
      setColumnDimension(initialDims[1] || initialDims[0] || '')

      const levels: Record<string, number> = {}
      for (const dim of initialDims) {
        levels[dim] = 0
      }
      setCurrentLevels(levels)
    }

    if (measures.length > 0) {
      setSelectedMeasures([measures[0].name])
    }
  }

  const loadReports = async () => {
    const response = await fetch(`/api/reports?dashboardId=${encodeURIComponent(dashboardId)}`, {
      cache: 'no-store',
    })
    const payload = await response.json()
    if (response.ok && payload?.success) {
      setReports(Array.isArray(payload.data) ? payload.data : [])
    }
  }

  const queryCube = async () => {
    if (selectedDimensions.length === 0 || selectedMeasures.length === 0) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const compactFilters = Object.entries(filters).reduce<Record<string, string>>((acc, [key, values]) => {
        if (values.length > 0) {
          acc[key] = values[0]
        }
        return acc
      }, {})

      const response = await fetch('/api/cube/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedDimensions,
          selectedMeasures,
          currentLevels,
          filters: compactFilters,
        }),
      })

      const payload: CubeQueryResponse = await response.json()
      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Cube query failed.')
      }

      setData(Array.isArray(payload.rows) ? payload.rows : [])
      setVisibleRows(50)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to query cube data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMeta().catch((err) => {
      setError(err instanceof Error ? err.message : 'Unable to load metadata.')
    })
    loadReports().catch(() => {
      // Keep UI usable even if reports cannot be loaded.
    })
  }, [])

  useEffect(() => {
    if (selectedDimensions.length > 0 && selectedMeasures.length > 0) {
      queryCube().catch(() => {
        // Error state handled in queryCube.
      })
    }
  }, [selectedDimensions, selectedMeasures, currentLevels, filters])

  useEffect(() => {
    setEnabledFilterDimensions((prev) => {
      const kept = prev.filter((dimension) => selectedDimensions.includes(dimension))
      const added = selectedDimensions.filter((dimension) => !kept.includes(dimension))
      return [...kept, ...added]
    })
  }, [selectedDimensions])

  const dimensionMap = useMemo(() => {
    const map = new Map<string, CubeMetaDimension>()
    for (const item of meta?.dimensions || []) {
      map.set(item.name, item)
    }
    return map
  }, [meta])

  const dimensionValues = useMemo(() => {
    const values: Record<string, string[]> = {}
    for (const dim of selectedDimensions) {
      values[dim] = []
    }

    for (const row of data) {
      for (const dim of selectedDimensions) {
        const value = row.dimensions[dim]
        if (value && !values[dim].includes(value)) {
          values[dim].push(value)
        }
      }
    }

    return values
  }, [data, selectedDimensions])

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (selectedKey && rowDimension && row.dimensions[rowDimension] !== selectedKey) {
        return false
      }

      for (const [dimension, values] of Object.entries(filters)) {
        if (values.length > 0 && !values.includes(row.dimensions[dimension])) {
          return false
        }
      }

      return true
    })
  }, [data, filters, rowDimension, selectedKey])

  const visibleData = useMemo(() => filteredData.slice(0, visibleRows), [filteredData, visibleRows])

  const chartData = useMemo<ChartPoint[]>(() => {
    if (!rowDimension || !primaryMeasure) {
      return []
    }

    const buckets = new Map<string, number>()
    for (const row of filteredData) {
      const key = row.dimensions[rowDimension] || '(N/A)'
      const value = Number(row.measures[primaryMeasure] || 0)
      buckets.set(key, (buckets.get(key) || 0) + value)
    }

    return Array.from(buckets.entries()).map(([name, value]) => ({ name, value }))
  }, [filteredData, rowDimension, primaryMeasure])

  const kpis = useMemo(() => {
    const values = filteredData
      .map((row) => Number(row.measures[primaryMeasure] || 0))
      .filter((value) => Number.isFinite(value))

    const total = values.reduce((sum, value) => sum + value, 0)
    const avg = values.length > 0 ? total / values.length : 0
    const max = values.length > 0 ? Math.max(...values) : 0
    const min = values.length > 0 ? Math.min(...values) : 0

    return {
      total,
      avg,
      max,
      min,
      rows: filteredData.length,
    }
  }, [filteredData, primaryMeasure])

  const getCellClass = (value: number) => {
    if (!Number.isFinite(value)) {
      return ''
    }
    if (value >= kpis.avg * 1.2) {
      return 'bg-emerald-100 text-emerald-800'
    }
    if (value <= kpis.avg * 0.8) {
      return 'bg-amber-100 text-amber-800'
    }
    return ''
  }

  const toggleDimension = (dimensionName: string, checked: boolean) => {
    const next = checked
      ? [...selectedDimensions, dimensionName]
      : selectedDimensions.filter((item) => item !== dimensionName)

    setSelectedDimensions(next)

    if (!checked) {
      setCurrentLevels((prev) => {
        const copy = { ...prev }
        delete copy[dimensionName]
        return copy
      })

      setFilters((prev) => {
        const copy = { ...prev }
        delete copy[dimensionName]
        return copy
      })

      if (rowDimension === dimensionName) {
        setRowDimension(next[0] || '')
      }
      if (columnDimension === dimensionName) {
        setColumnDimension(next[1] || next[0] || '')
      }
      return
    }

    setCurrentLevels((prev) => ({ ...prev, [dimensionName]: prev[dimensionName] ?? 0 }))
    if (!rowDimension) {
      setRowDimension(dimensionName)
    } else if (!columnDimension) {
      setColumnDimension(dimensionName)
    }
  }

  const toggleMeasure = (measure: string, checked: boolean) => {
    if (checked) {
      setSelectedMeasures((prev) => (prev.includes(measure) ? prev : [...prev, measure]))
      return
    }
    setSelectedMeasures((prev) => prev.filter((item) => item !== measure))
  }

  const handleDrill = (dimension: string, step: 1 | -1) => {
    const hierarchyLevels = dimensionMap.get(dimension)?.hierarchy || []
    setCurrentLevels((prev) => {
      const current = prev[dimension] ?? 0
      const next = Math.max(0, Math.min(current + step, Math.max(hierarchyLevels.length - 1, 0)))
      return { ...prev, [dimension]: next }
    })
  }

  const handleClearAllFilters = () => {
    setFilters({})
    setSelectedKey(null)
  }

  const toggleFilterDimension = (dimension: string, checked: boolean) => {
    setEnabledFilterDimensions((prev) => {
      if (checked) {
        return prev.includes(dimension) ? prev : [...prev, dimension]
      }
      return prev.filter((item) => item !== dimension)
    })

    if (!checked) {
      setFilters((prev) => {
        if (!prev[dimension]) {
          return prev
        }
        const next = { ...prev }
        delete next[dimension]
        return next
      })
    }
  }

  const handleSwapAxes = () => {
    const prevRow = rowDimension
    setRowDimension(columnDimension)
    setColumnDimension(prevRow)
  }

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format,
        dashboardId,
        data: filteredData.map((row) => ({ ...row.dimensions, ...row.measures })),
      }),
    })

    if (!response.ok) {
      setError('Export failed. Please try again.')
      return
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `analysis-${dashboardId}.${format === 'excel' ? 'xlsx' : format}`
    anchor.click()
  }

  const saveReport = async () => {
    const name = newReportName.trim()
    if (!name) {
      return
    }

    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dashboardId,
        name,
        description: 'Saved BI view configuration',
        config: {
          selectedDimensions,
          currentLevels,
          selectedMeasures,
          filters,
          rowDimension,
          columnDimension,
          chartType,
        },
      }),
    })

    const payload = await response.json()
    if (!response.ok || !payload?.success) {
      setError(payload?.error || 'Unable to save report.')
      return
    }

    setReports((prev) => [payload.data, ...prev])
    setNewReportName('')
  }

  const applyReport = (reportId: string) => {
    const report = reports.find((item) => item.id === reportId)
    if (!report) {
      return
    }

    const config = report.config
    setSelectedDimensions(config.selectedDimensions || [])
    setCurrentLevels(config.currentLevels || {})
    setSelectedMeasures(config.selectedMeasures || [])
    setFilters(config.filters || {})
    setRowDimension(config.rowDimension || '')
    setColumnDimension(config.columnDimension || '')
    setChartType(config.chartType || 'line')
  }

  const deleteReport = async (reportId: string) => {
    const response = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' })
    const payload = await response.json()
    if (!response.ok || !payload?.success) {
      setError(payload?.error || 'Unable to delete report.')
      return
    }

    setReports((prev) => prev.filter((item) => item.id !== reportId))
  }

  return (
    <div className="space-y-6 [&_p]:leading-5">
      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl tracking-tight">OLAP Analytics</CardTitle>
              <CardDescription className="mt-1 text-sm">
                BI-style analysis workspace with dimensions, measures, slicers, and linked pivot/chart interaction.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={queryCube} className="h-9 gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAllFilters} className="h-9 gap-2">
                <RotateCcw className="h-4 w-4" />
                Clear All Filters
              </Button>
              <Button variant="outline" size="sm" onClick={handleSwapAxes} className="h-9 gap-2">
                <ArrowDownUp className="h-4 w-4" />
                Swap Axes
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('excel')}>Excel</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
        <div className="space-y-5">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base tracking-tight">Model Explorer</CardTitle>
              <CardDescription className="text-sm">Select active dimensions and hierarchy levels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {meta?.dimensions?.map((dimension) => {
                const active = selectedDimensions.includes(dimension.name)
                const levelIndex = currentLevels[dimension.name] ?? 0
                return (
                  <div key={dimension.name} className="rounded-md border border-border p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground leading-5">{dimension.name}</span>
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={(e) => toggleDimension(dimension.name, e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground leading-5">
                      {DIMENSION_DESCRIPTION[dimension.name] || 'Multidimensional analysis axis.'}
                    </p>
                    {active && (
                      <>
                        <Select
                          value={String(levelIndex)}
                          onValueChange={(value) =>
                            setCurrentLevels((prev) => ({ ...prev, [dimension.name]: Number(value) }))
                          }
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {dimension.hierarchy.map((level, index) => (
                              <SelectItem key={level} value={String(index)}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleDrill(dimension.name, -1)} className="h-8">
                            Roll-up
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDrill(dimension.name, 1)} className="h-8">
                            Drill-down
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base tracking-tight">Measure Selector</CardTitle>
              <CardDescription className="text-sm">Choose one or multiple measures for analysis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {meta?.measures?.map((measure) => (
                <label key={measure.uniqueName} className="flex gap-2.5 items-start rounded-md border border-border p-2.5">
                  <input
                    type="checkbox"
                    checked={selectedMeasures.includes(measure.name)}
                    onChange={(e) => toggleMeasure(measure.name, e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm leading-5">
                    <span className="font-medium text-foreground leading-5">{measure.name}</span>
                    <span className="block text-xs text-muted-foreground leading-5">
                      {MEASURE_DESCRIPTION[measure.name] || 'Key numeric metric for BI reporting.'}
                    </span>
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base tracking-tight">Slicers (Dice)</CardTitle>
              <CardDescription className="text-sm">Tick field checkbox to decide whether to use that filter.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedDimensions.map((dimension) => (
                <div key={dimension} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enabledFilterDimensions.includes(dimension)}
                    onChange={(e) => toggleFilterDimension(dimension, e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                    aria-label={`Use ${dimension} filter`}
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-9 w-full justify-between text-sm"
                        disabled={!enabledFilterDimensions.includes(dimension)}
                      >
                        <span className="truncate">{dimension}</span>
                        <div className="flex items-center gap-2">
                          {(filters[dimension] || []).length > 0 && (
                            <Badge variant="secondary">{filters[dimension].length}</Badge>
                          )}
                          <Filter className="h-4 w-4" />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80" align="end">
                      <DropdownMenuLabel>{dimension}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {(dimensionValues[dimension] || []).slice(0, 20).map((value) => (
                        <DropdownMenuCheckboxItem
                          key={`${dimension}-${value}`}
                          checked={(filters[dimension] || []).includes(value)}
                          onCheckedChange={(checked) => {
                            setFilters((prev) => {
                              const current = prev[dimension] || []
                              const next = checked
                                ? [...current, value]
                                : current.filter((item) => item !== value)
                              return { ...prev, [dimension]: next }
                            })
                          }}
                        >
                          {value}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base tracking-tight">Saved Reports</CardTitle>
              <CardDescription className="text-sm">Save and reuse your BI configuration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Report name"
                  value={newReportName}
                  onChange={(e) => setNewReportName(e.target.value)}
                />
                <Button size="sm" onClick={saveReport} className="h-9 gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>

              <Select onValueChange={applyReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Load saved report" />
                </SelectTrigger>
                <SelectContent>
                  {reports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="max-h-28 space-y-1 overflow-y-auto">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between rounded border border-border px-2.5 py-1.5">
                    <span className="text-xs truncate pr-2 leading-5">{report.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => deleteReport(report.id)} className="h-7 w-7 p-0 text-xs">
                      X
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="border-border/60 lg:col-span-2">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Current Measure</p>
                <p className="text-base font-semibold text-foreground truncate leading-6">{primaryMeasure || '-'}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Rows</p>
                <p className="text-base font-semibold leading-6">{kpis.rows.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Average</p>
                <p className="text-base font-semibold leading-6">{formatMeasure(kpis.avg, primaryMeasure || 'value')}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Max</p>
                <p className="text-base font-semibold leading-6">{formatMeasure(kpis.max, primaryMeasure || 'value')}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base tracking-tight">Field Wells</CardTitle>
                  <CardDescription className="text-sm">Rows, Columns, Values, and Chart orientation.</CardDescription>
                </div>
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Select value={rowDimension} onValueChange={setRowDimension}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent>
                  {selectedDimensions.map((dimension) => (
                    <SelectItem key={dimension} value={dimension}>
                      Rows: {dimension}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={columnDimension} onValueChange={setColumnDimension}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Columns" />
                </SelectTrigger>
                <SelectContent>
                  {selectedDimensions.map((dimension) => (
                    <SelectItem key={dimension} value={dimension}>
                      Columns: {dimension}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={chartType} onValueChange={(value: 'line' | 'bar' | 'heatmap') => setChartType(value)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Chart" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Trendline</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="heatmap">Heatmap</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Tabs defaultValue="pivot" className="w-full">
            <TabsList className="grid h-10 w-full grid-cols-3">
              <TabsTrigger value="pivot" className="text-sm">Pivot Table</TabsTrigger>
              <TabsTrigger value="visual" className="text-sm">Visualization</TabsTrigger>
              <TabsTrigger value="raw" className="text-sm">Raw Data</TabsTrigger>
            </TabsList>

            <TabsContent value="pivot" className="mt-4">
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Interactive Pivot Table</CardTitle>
                  <CardDescription>
                    Lazy loading enabled ({visibleData.length}/{filteredData.length}). Conditional formatting highlights anomalies.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">Querying OLAP server...</p>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{rowDimension || 'Row'}</TableHead>
                            <TableHead>{columnDimension || 'Column'}</TableHead>
                            {selectedMeasures.map((measure) => (
                              <TableHead key={measure} className="text-right">
                                {measure}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {visibleData.map((row, index) => {
                            const rowKey = row.dimensions[rowDimension] || `${index}`
                            const expanded = expandedRows.has(rowKey)
                            const highlight = selectedKey === rowKey
                            return (
                              <TableRow
                                key={`${rowKey}-${index}`}
                                className={`${highlight ? 'bg-primary/10' : ''} align-middle`}
                                onClick={() => setSelectedKey(rowKey)}
                              >
                                <TableCell className="align-middle">
                                  <button
                                    className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      setExpandedRows((prev) => {
                                        const next = new Set(prev)
                                        if (next.has(rowKey)) {
                                          next.delete(rowKey)
                                        } else {
                                          next.add(rowKey)
                                        }
                                        return next
                                      })
                                    }}
                                  >
                                    {expanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </button>
                                  {rowKey}
                                </TableCell>
                                <TableCell className="align-middle">{row.dimensions[columnDimension] || '-'}</TableCell>
                                {selectedMeasures.map((measure) => {
                                  const value = Number(row.measures[measure] || 0)
                                  return (
                                    <TableCell key={`${rowKey}-${measure}`} className={`text-right align-middle font-medium tabular-nums ${getCellClass(value)}`}>
                                      {formatMeasure(value, measure)}
                                    </TableCell>
                                  )
                                })}
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>

                      {visibleRows < filteredData.length && (
                        <div className="mt-4">
                          <Button variant="outline" onClick={() => setVisibleRows((prev) => prev + 50)}>
                            Load More
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visual" className="mt-4">
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Linked BI Visualization
                  </CardTitle>
                  <CardDescription>
                    Click chart element to filter table. Click table row to focus chart.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-110">
                  {chartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No chart data.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'line' ? (
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                          <XAxis dataKey="name" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #cbd5e1' }} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{
                              onClick: (entry: unknown) => {
                                const payload = (entry as { payload?: { name?: string } })?.payload
                                if (payload?.name) {
                                  setSelectedKey(payload.name)
                                }
                              },
                            }}
                          />
                        </LineChart>
                      ) : (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                          <XAxis dataKey="name" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #cbd5e1' }} />
                          <Legend />
                          <Bar
                            dataKey="value"
                            onClick={(payload) => {
                              const datum = payload as { name?: string }
                              if (datum?.name) {
                                setSelectedKey(datum.name)
                              }
                            }}
                          >
                            {chartData.map((point, index) => {
                              const intensity = chartType === 'heatmap' && kpis.max > 0
                                ? Math.max(0.2, Math.min(1, point.value / kpis.max))
                                : 1
                              const fillColor = chartType === 'heatmap'
                                ? `rgba(14,165,233,${intensity})`
                                : CHART_COLORS[index % CHART_COLORS.length]

                              return (
                                <Cell
                                  key={point.name}
                                  fill={selectedKey === point.name ? '#0ea5e9' : fillColor}
                                />
                              )
                            })}
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="raw" className="mt-4">
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Raw Data Preview</CardTitle>
                  <CardDescription>Useful for validation and troubleshooting.</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="max-h-110 overflow-auto rounded bg-muted p-3 text-xs">
                    {JSON.stringify(visibleData.slice(0, 20), null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">
              Warning: {error}. This may indicate cube processing issue or OLAP server source failure.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

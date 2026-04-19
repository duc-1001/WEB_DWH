'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Trash2, Download, ArrowRightLeft, ChevronDown, ChevronRight, FileJson, FileSpreadsheet } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PivotData {
  [key: string]: any
}

const MOCK_DATA: PivotData[] = [
  { Region: 'North', Quarter: 'Q1', Year: '2024', Sales: 150000, Orders: 245, Customers: 156, Profit: 45000 },
  { Region: 'North', Quarter: 'Q2', Year: '2024', Sales: 175000, Orders: 312, Customers: 189, Profit: 52500 },
  { Region: 'North', Quarter: 'Q1', Year: '2023', Sales: 120000, Orders: 198, Customers: 124, Profit: 36000 },
  { Region: 'South', Quarter: 'Q1', Year: '2024', Sales: 120000, Orders: 198, Customers: 124, Profit: 36000 },
  { Region: 'South', Quarter: 'Q2', Year: '2024', Sales: 145000, Orders: 267, Customers: 167, Profit: 43500 },
  { Region: 'East', Quarter: 'Q1', Year: '2024', Sales: 180000, Orders: 289, Customers: 201, Profit: 54000 },
  { Region: 'East', Quarter: 'Q2', Year: '2024', Sales: 210000, Orders: 356, Customers: 234, Profit: 63000 },
  { Region: 'West', Quarter: 'Q1', Year: '2024', Sales: 165000, Orders: 276, Customers: 178, Profit: 49500 },
  { Region: 'West', Quarter: 'Q2', Year: '2024', Sales: 195000, Orders: 334, Customers: 212, Profit: 58500 },
]

const DIMENSIONS = ['Region', 'Quarter', 'Year']
const MEASURES = ['Sales', 'Orders', 'Customers', 'Profit']

export function PivotTable() {
  const [rows, setRows] = useState<string[]>(['Region'])
  const [columns, setColumns] = useState<string[]>(['Quarter'])
  const [measures, setMeasures] = useState<string[]>(['Sales'])
  const [data, setData] = useState(MOCK_DATA)
  const [swapped, setSwapped] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showTotals, setShowTotals] = useState(true)
  const [sortBy, setSortBy] = useState<'asc' | 'desc'>('desc')

  const handleRefresh = () => {
    setData([...MOCK_DATA])
  }

  const handleClear = () => {
    setRows(['Region'])
    setColumns(['Quarter'])
    setMeasures(['Sales'])
    setExpandedRows(new Set())
  }

  const handleSwapAxes = () => {
    setSwapped(!swapped)
    const temp = rows
    setRows(columns)
    setColumns(temp)
  }

  const toggleRowExpand = (rowKey: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(rowKey)) {
      newExpanded.delete(rowKey)
    } else {
      newExpanded.add(rowKey)
    }
    setExpandedRows(newExpanded)
  }

  const exportAsCSV = () => {
    const csv = generateCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pivot-table-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const exportAsJSON = () => {
    const json = JSON.stringify({ rows, columns, measures, data }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pivot-table-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const getConditionalColor = (value: number, measure: string) => {
    if (measure === 'Sales' || measure === 'Profit') {
      if (value > 200000) return 'bg-green-950/30'
      if (value > 150000) return 'bg-blue-950/30'
      if (value < 120000) return 'bg-orange-950/30'
    }
    return ''
  }

  const generateCSV = () => {
    const headers = ['', ...getColumnValues()]
    const rows_list = getRowValues()
    
    let csv = headers.join(',') + '\n'
    rows_list.forEach((rowVal: string) => {
      const row = [rowVal]
      getColumnValues().forEach((colVal: string) => {
        const value = data.find(d => 
          getRowKey(d) === rowVal && getColumnKey(d) === colVal
        )?.[measures[0]] || '-'
        row.push(value.toString())
      })
      csv += row.join(',') + '\n'
    })
    return csv
  }

  const getRowValues = () => {
    const seen = new Set()
    data.forEach(d => {
      const key = getRowKey(d)
      if (!seen.has(key)) {
        seen.add(key)
      }
    })
    return Array.from(seen).sort()
  }

  const getColumnValues = () => {
    const seen = new Set()
    data.forEach(d => {
      const key = getColumnKey(d)
      if (!seen.has(key)) {
        seen.add(key)
      }
    })
    return Array.from(seen).sort()
  }

  const getRowKey = (d: PivotData) => rows.map(r => d[r]).join(' - ')
  const getColumnKey = (d: PivotData) => columns.map(c => d[c]).join(' - ')

  const tableRows = getRowValues()
  const tableColumns = getColumnValues()

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            ⚙️ Configure Pivot Table
          </CardTitle>
          <CardDescription>Arrange your data with rows, columns, and measures</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Rows Selection */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Rows</label>
              <Select value={rows[0]} onValueChange={(val) => setRows([val])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIMENSIONS.map(d => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Columns Selection */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Columns</label>
              <Select value={columns[0]} onValueChange={(val) => setColumns([val])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIMENSIONS.map(d => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Measures Selection */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Measure</label>
              <Select value={measures[0]} onValueChange={(val) => setMeasures([val])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEASURES.map(m => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear All Filters
            </Button>
            <Button variant="outline" size="sm" onClick={handleSwapAxes} className="gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Swap Axes
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportAsCSV} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAsJSON} className="gap-2">
                  <FileJson className="h-4 w-4" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Pivot Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Presentation</CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">{rows[0] || 'Rows'}</Badge>
            <Badge variant="secondary">{columns[0] || 'Columns'}</Badge>
            <Badge className="bg-primary">{measures[0] || 'Measure'}</Badge>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32 bg-muted text-muted-foreground">{rows[0]}</TableHead>
                {tableColumns.map((col) => (
                  <TableHead key={col} className="text-right bg-muted text-muted-foreground">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.map((rowVal) => {
                const isExpanded = expandedRows.has(rowVal)
                const cellValue = data.find(
                  d => getRowKey(d) === rowVal && getColumnKey(d) === tableColumns[0]
                )?.[measures[0]] || 0
                
                return (
                  <TableRow key={rowVal} className={getConditionalColor(cellValue as number, measures[0])}>
                    <TableCell className="font-medium text-foreground bg-card">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleRowExpand(rowVal)}
                          className="hover:bg-muted rounded p-1 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <span>{rowVal}</span>
                      </div>
                    </TableCell>
                    {tableColumns.map((colVal) => {
                      const value = data.find(
                        d => getRowKey(d) === rowVal && getColumnKey(d) === colVal
                      )?.[measures[0]]
                      return (
                        <TableCell
                          key={`${rowVal}-${colVal}`}
                          className={`text-right text-foreground font-medium ${getConditionalColor(value as number, measures[0])}`}
                        >
                          {value ? (
                            measures[0] === 'Sales' || measures[0] === 'Profit' ? (
                              `$${(value as number).toLocaleString()}`
                            ) : (
                              (value as number).toLocaleString()
                            )
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

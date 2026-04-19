'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CubeRow } from '../../types/olap'

interface PivotTableViewProps {
  rows: CubeRow[]
  columns: { key: string; label: string; source: 'filter' | 'dimension' }[]
  measures: string[]
  filters: Record<string, string>
}

export function PivotTableView({
  rows,
  columns,
  measures,
  filters,
}: PivotTableViewProps) {
  const [rowKey, setRowKey] = useState('')
  const [colKey, setColKey] = useState('')
  const [measure, setMeasure] = useState(measures[0] || '')

  useEffect(() => {
    if (columns.length >= 2) {
      setRowKey(columns[0].key)
      setColKey(columns[1].key)
    }
  }, [columns])

  const pivotData = useMemo(() => {
    if (!rowKey || !colKey || !measure) {
      return {
        rowValues: [],
        colValues: [],
        grid: {} as Record<string, Record<string, number>>,
        rowTotals: {} as Record<string, number>,
        colTotals: {} as Record<string, number>,
        grandTotal: 0,
      }
    }

    const rowSet = new Set<string>()
    const colSet = new Set<string>()

    const grid: Record<string, Record<string, number>> = {}
    const rowTotals: Record<string, number> = {}
    const colTotals: Record<string, number> = {}

    let grandTotal = 0

    const rowCol = columns.find(c => c.key === rowKey)
    const colCol = columns.find(c => c.key === colKey)

    for (const row of rows) {
      const rVal =
        rowCol?.source === 'dimension'
          ? String(row.dimensions[rowKey] || 'N/A')
          : filters[rowKey] || 'N/A'

      const cVal =
        colCol?.source === 'dimension'
          ? String(row.dimensions[colKey] || 'N/A')
          : filters[colKey] || 'N/A'

      const value = Number(row.measures[measure] || 0)

      rowSet.add(rVal)
      colSet.add(cVal)

      if (!grid[rVal]) grid[rVal] = {}
      grid[rVal][cVal] = (grid[rVal][cVal] || 0) + value

      rowTotals[rVal] = (rowTotals[rVal] || 0) + value
      colTotals[cVal] = (colTotals[cVal] || 0) + value
      grandTotal += value
    }

    return {
      rowValues: Array.from(rowSet).sort(),
      colValues: Array.from(colSet).sort(),
      grid,
      rowTotals,
      colTotals,
      grandTotal,
    }
  }, [rows, rowKey, colKey, measure, columns, filters])

  const rowLabel = columns.find(c => c.key === rowKey)?.label || rowKey
  const colLabel = columns.find(c => c.key === colKey)?.label || colKey

  return (
    <div className="space-y-4">

      {/* Controls */}

      <div className="flex flex-wrap gap-4 items-center">

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Rows</span>

          <Select value={rowKey} onValueChange={setRowKey}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {columns.map(c => (
                <SelectItem key={c.key} value={c.key}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Columns</span>

          <Select value={colKey} onValueChange={setColKey}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {columns.map(c => (
                <SelectItem key={c.key} value={c.key}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Measure</span>

          <Select value={measure} onValueChange={setMeasure}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {measures.map(m => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>

      {/* TABLE */}

      <div className="border rounded-lg overflow-x-auto">

        <Table className="min-w-max text-sm">

          <TableHeader>
            <TableRow className="bg-slate-100">

              <TableHead className="font-semibold">
                {rowLabel} / {colLabel}
              </TableHead>

              {pivotData.colValues.map(cv => (
                <TableHead key={cv} className="text-right">
                  {cv}
                </TableHead>
              ))}

              <TableHead className="text-right font-semibold">
                Total
              </TableHead>

            </TableRow>
          </TableHeader>

          <TableBody>

            {pivotData.rowValues.map((rv, idx) => (

              <TableRow key={rv} className={idx % 2 ? 'bg-slate-50' : ''}>

                <TableCell className="font-medium">
                  {rv}
                </TableCell>

                {pivotData.colValues.map(cv => {
                  const val = pivotData.grid[rv]?.[cv] || 0

                  return (
                    <TableCell key={cv} className="text-right tabular-nums">
                      {val ? val.toLocaleString('vi-VN') : '-'}
                    </TableCell>
                  )
                })}

                <TableCell className="text-right font-semibold">
                  {(pivotData.rowTotals[rv] || 0).toLocaleString('vi-VN')}
                </TableCell>

              </TableRow>

            ))}

          </TableBody>

          <tfoot className="bg-slate-100 font-semibold">

            <TableRow>

              <TableCell>Total</TableCell>

              {pivotData.colValues.map(cv => (
                <TableCell key={cv} className="text-right">
                  {(pivotData.colTotals[cv] || 0).toLocaleString('vi-VN')}
                </TableCell>
              ))}

              <TableCell className="text-right">
                {pivotData.grandTotal.toLocaleString('vi-VN')}
              </TableCell>

            </TableRow>

          </tfoot>

        </Table>

      </div>
    </div>
  )
}
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
import { ArrowLeftRight } from 'lucide-react'
import { CubeRow } from '../../types/olap'

interface PivotTableViewProps {
  rows: CubeRow[]
  columns: { key: string; label: string; source: 'filter' | 'dimension' }[]
  measures: string[]
  filters: Record<string, string | string[]>
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
    } else if (columns.length === 1) {
      setRowKey(columns[0].key)
      setColKey(columns[0].key)
    }
  }, [columns])

  const swapAxis = () => {
    setRowKey(colKey)
    setColKey(rowKey)
  }

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
          : (() => { const v = filters[rowKey]; return Array.isArray(v) ? (v.length > 0 ? v.join(', ') : 'N/A') : String(v || 'N/A') })()

      const cVal =
        colCol?.source === 'dimension'
          ? String(row.dimensions[colKey] || 'N/A')
          : (() => { const v = filters[colKey]; return Array.isArray(v) ? (v.length > 0 ? v.join(', ') : 'N/A') : String(v || 'N/A') })()

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

        <button
          onClick={swapAxis}
          className="flex items-center justify-center h-8 w-8 border rounded-md hover:bg-slate-100 transition-colors"
          title="Swap rows & columns"
        >
          <ArrowLeftRight size={14} />
        </button>
      </div>

      {/* Bảng Pivot - Đã tối ưu không tràn sidebar */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div
          className="overflow-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400"
          style={{ maxWidth: 'calc(100vw - 500px)' }} // Giảm 300px để tránh đè sidebar
        >
          <Table className="w-full text-sm border-collapse whitespace-nowrap">
            <TableHeader className="sticky top-0 bg-slate-100 z-10">
              <TableRow>
                <TableHead className="font-semibold sticky left-0 bg-slate-100 z-20 px-4 py-3 border-r shadow-sm">
                  {rowLabel} / {colLabel}
                </TableHead>

                {pivotData.colValues.map(cv => (
                  <TableHead
                    key={cv}
                    className="text-right whitespace-nowrap px-4 py-3 font-medium"
                  >
                    {cv}
                  </TableHead>
                ))}

                <TableHead className="text-right font-semibold sticky right-0 bg-slate-100 z-20 px-4 border-l shadow-sm">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {pivotData.rowValues.map((rv, idx) => (
                <TableRow
                  key={rv}
                  className={idx % 2 === 1 ? 'bg-slate-50' : ''}
                >
                  <TableCell className="font-medium sticky left-0 bg-white z-10 border-r px-4 min-w-[180px]">
                    {rv}
                  </TableCell>

                  {pivotData.colValues.map(cv => {
                    const val = pivotData.grid[rv]?.[cv] || 0
                    return (
                      <TableCell
                        key={cv}
                        className="text-right tabular-nums px-4 py-2.5 min-w-[110px]"
                      >
                        {val ? val.toLocaleString('vi-VN') : '-'}
                      </TableCell>
                    )
                  })}

                  <TableCell className="text-right font-semibold sticky right-0 bg-white z-10 border-l px-4">
                    {(pivotData.rowTotals[rv] || 0).toLocaleString('vi-VN')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            <tfoot className="sticky bottom-0 bg-slate-100 z-10 font-semibold">
              <TableRow>
                <TableCell className="sticky left-0 bg-slate-100 font-bold border-r px-4">
                  Total
                </TableCell>
                {pivotData.colValues.map(cv => (
                  <TableCell key={cv} className="text-right px-4 py-3">
                    {(pivotData.colTotals[cv] || 0).toLocaleString('vi-VN')}
                  </TableCell>
                ))}
                <TableCell className="text-right sticky right-0 bg-slate-100 font-bold px-4">
                  {pivotData.grandTotal.toLocaleString('vi-VN')}
                </TableCell>
              </TableRow>
            </tfoot>
          </Table>
        </div>
      </div>
    </div>
  )
}
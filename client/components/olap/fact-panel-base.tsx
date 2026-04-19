import { ChartDisplayPanel } from './chart-display-panel'
import { MeasureChartConfigPanel } from './measure-chart-config'
import type { ChartType } from './measure-chart-config'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  X, 
  ChevronDown, 
  Layers, 
  Filter,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  FactKey,
  DimensionMeta,
  MeasureMeta,
  FilterState,
  CubeRow,
} from '../../types/olap'
import { JSX } from 'react/jsx-dev-runtime'


type TableColumn = {
  key: string
  label: string
  source: 'filter' | 'dimension'
}

type FactConfigEntry = {
  label: string
}

type FactStateView = {
  dimensions: DimensionMeta[]
  measures: MeasureMeta[]
  selectedDimensions: string[]
  currentLevels: Record<string, number[]>
  memberSearchQueries: Record<string, string>
  selectedMeasures: string[]
  chartType: ChartType
  filters: FilterState
  rows: CubeRow[]
  metaLoading: boolean
  dataLoading: boolean
  tableLoading: boolean
  errorMessage: string
}

type FactPanelBaseProps = {
  activeFact: FactKey
  factConfig: Record<FactKey, FactConfigEntry>
  activeState: FactStateView
  availableDimensionOptions: DimensionMeta[]
  filteredRows: CubeRow[]
  tableColumns: TableColumn[]
  measureTotals: Record<string, number>
  showTotalsRow: boolean
  queryableDimensionCount: number
  hasTimeDimension: boolean
  setActiveFact: (nextFact: FactKey) => void
  toggleDimension: (name: string) => void
  toggleDimensionLevel: (dimensionName: string, levelIndex: number) => void
  toggleMeasure: (name: string) => void
  updateChartType: (nextType: ChartType) => void
  updateMemberSearchQuery: (dimensionName: string, levelIndex: number, value: string) => void
  getNormalizedLevelIndexes: (dimension: DimensionMeta, currentIndexes: number[] | number | undefined) => number[]
  getAllowedLevelIndexes: (dimension: DimensionMeta) => number[]
  getSelectedLevelLabels: (dimension: DimensionMeta, selectedLevelIndexes: number[]) => string[]
  getDimensionFieldKey: (dimension: DimensionMeta, levelIndex: number) => string
  formatDimLabel: (value: string) => string
  Skeleton: ({ className }: { className?: string }) => JSX.Element
}

import React, { useState } from 'react';

export function FactPanelBase({
  activeFact,
  factConfig,
  activeState,
  availableDimensionOptions,
  filteredRows,
  tableColumns,
  measureTotals,
  showTotalsRow,
  queryableDimensionCount,
  hasTimeDimension,
  setActiveFact,
  toggleDimension,
  toggleDimensionLevel,
  toggleMeasure,
  updateChartType,
  updateMemberSearchQuery,
  getNormalizedLevelIndexes,
  getAllowedLevelIndexes,
  getSelectedLevelLabels,
  getDimensionFieldKey,
  formatDimLabel,
  Skeleton,
}: FactPanelBaseProps) {
  const [dimensionFilter, setDimensionFilter] = useState('');
  const filteredDimensionOptions = dimensionFilter
    ? availableDimensionOptions.filter((dimension) =>
        formatDimLabel(dimension.name).toLowerCase().includes(dimensionFilter.toLowerCase())
      )
    : availableDimensionOptions;

  return (
    <section className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:p-4">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-800">Cấu hình dữ liệu</h2>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(Object.keys(factConfig) as FactKey[]).map((factKey) => (
            <Button
              key={factKey}
              variant={activeFact === factKey ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFact(factKey)}
              className={`h-8 px-4 text-[11px] font-semibold transition-all ${
                activeFact === factKey
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {factConfig[factKey].label}
            </Button>
          ))}
        </div>
      </div>

      {activeState.errorMessage ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">{activeState.errorMessage}</div>
      ) : null}

      <div className="space-y-4">
        {activeState.metaLoading ? (
          <div className="space-y-2 px-1">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : null}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-emerald-100 text-emerald-700">
                <Layers size={14} />
              </div>
              <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-tight">Thuộc tính phân tích</h3>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-[10px] font-bold uppercase border-emerald-200 bg-emerald-50/30 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-700 transition-all shadow-none">
                  <Plus size={12} />
                  <span>Thêm thuộc tính</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {availableDimensionOptions.length > 0 ? (
                  <>
                    <div className="px-2 pt-2 pb-1">
                      <input
                        autoFocus
                        value={dimensionFilter}
                        onChange={e => setDimensionFilter(e.target.value)}
                        placeholder="Tìm kiếm..."
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {filteredDimensionOptions.length > 0 ? (
                        filteredDimensionOptions.map((dimension) => (
                          <DropdownMenuItem 
                            key={dimension.name} 
                            onClick={() => {
                              toggleDimension(dimension.name);
                              setDimensionFilter('');
                            }}
                            className="gap-2 cursor-pointer text-xs py-2"
                          >
                            <span className="font-medium">{formatDimLabel(dimension.name)}</span>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="px-2 py-3 text-center text-[10px] text-slate-400 italic">Không có kết quả</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="px-2 py-3 text-center text-[10px] text-slate-400 italic">Tất cả đã chọn</div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="p-2 bg-slate-50/30">
            <div className="flex flex-wrap gap-1.5 min-h-[1.5rem] items-center">
              {activeState.selectedDimensions.length > 0 ? (
                activeState.selectedDimensions.map((dimensionName) => (
                  <Badge 
                    key={dimensionName}
                    variant="secondary"
                    className="pl-2.5 pr-1 py-0.5 gap-1 border-emerald-100 bg-white text-emerald-800 hover:bg-emerald-50 transition-colors cursor-default group shadow-sm"
                  >
                    <span className="text-[10px] font-bold uppercase">{formatDimLabel(dimensionName)}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDimension(dimensionName);
                      }}
                      className="p-0.5 rounded-full hover:bg-emerald-100 text-emerald-600 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-[10px] text-slate-400 italic px-1">Chưa chọn thuộc tính</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {activeState.dimensions
            .filter((dimension) => activeState.selectedDimensions.includes(dimension.name))
            .map((dimension) => {
              const selectedLevelIndexes = getNormalizedLevelIndexes(dimension, activeState.currentLevels[dimension.name])
              const allowedLevelIndexes = getAllowedLevelIndexes(dimension)
              const isDimensionSelected = selectedLevelIndexes.length > 0
              const selectedLevelLabels = getSelectedLevelLabels(dimension, selectedLevelIndexes)
              const memberSearchQueries = activeState.memberSearchQueries || {}
              return (
                <div
                  key={dimension.name}
                  className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition hover:border-emerald-200"
                >
                  <div className="flex items-center justify-between gap-2 px-1 mb-1.5">
                    <div className="flex items-center gap-2">
                       <span className="text-[11px] font-bold text-slate-800 uppercase">{formatDimLabel(dimension.name)}</span>
                    </div>
                    <button
                      onClick={() => toggleDimension(dimension.name)}
                      className="p-1 rounded-md text-slate-400 hover:bg-slate-100 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  
                  <div className="space-y-2 rounded-lg border border-slate-50 bg-slate-50/50 p-2">
                    <div className="flex flex-wrap gap-1.5">
                      {allowedLevelIndexes.map((index) => {
                        const level = dimension.hierarchy[index]
                        const checked = selectedLevelIndexes.includes(index)
                        return (
                          <button
                            key={level}
                            onClick={() => toggleDimensionLevel(dimension.name, index)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all text-[10px] font-medium ${
                              checked 
                              ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm' 
                              : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            <span className="truncate">{level}</span>
                          </button>
                        )
                      })}
                    </div>

                    {selectedLevelIndexes.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/50">
                        {selectedLevelIndexes.map((levelIndex) => {
                          const levelName = dimension.hierarchy[levelIndex]
                          const fieldKey = getDimensionFieldKey(dimension, levelIndex)
                          const memberQueryKey = `${dimension.name}::${levelIndex}`

                          return (
                            <div key={fieldKey} className="relative group">
                              <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                              <input
                                value={memberSearchQueries[memberQueryKey] || ''}
                                onChange={(event) => updateMemberSearchQuery(dimension.name, levelIndex, event.target.value)}
                                className="h-7 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2 text-[10px] outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10"
                                placeholder={`Lọc theo ${levelName}...`}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
        </div>

        <MeasureChartConfigPanel
          factLabel={factConfig[activeFact].label}
          measures={activeState.measures}
          selectedMeasures={activeState.selectedMeasures}
          chartType={activeState.chartType}
          onToggleMeasure={toggleMeasure}
          onChartTypeChange={updateChartType}
          dimensionCount={queryableDimensionCount}
          hasTimeDimension={hasTimeDimension}
        />
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 p-3">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Bảng dữ liệu</h3>
        {activeState.tableLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : filteredRows.length === 0 ? (
          <p className="text-sm text-slate-500">Không tìm thấy bản ghi phù hợp với điều kiện tìm kiếm.</p>
        ) : (
          <div className="max-h-125 overflow-auto rounded-lg border border-slate-100">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead className="sticky top-0 bg-slate-100 text-slate-700">
                <tr>
                  {tableColumns.map((column) => (
                    <th key={column.key} className="border-b border-slate-200 px-3 py-2 text-left font-semibold">
                      {column.label}
                    </th>
                  ))}
                  {activeState.selectedMeasures.map((measure) => (
                    <th key={measure} className="border-b border-slate-200 px-3 py-2 text-left font-semibold">
                      {measure}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, rowIndex) => (
                  <tr key={`${rowIndex}-${row.dimensions[tableColumns[0]?.key || ''] || 'row'}`} className="odd:bg-white even:bg-slate-50">
                    {tableColumns.map((column) => (
                      <td key={`${rowIndex}-${column.key}`} className="border-b border-slate-100 px-3 py-2">
                        {column.source === 'filter'
                          ? column.key === 'year'
                            ? activeState.filters.year
                            : column.key === 'quarter'
                              ? activeState.filters.quarter
                              : column.key === 'month'
                                ? activeState.filters.month
                                : column.key === 'state'
                                  ? activeState.filters.state
                                  : column.key === 'city'
                                    ? activeState.filters.city
                                    : column.key === 'customerType'
                                      ? activeState.filters.customerType
                                      : column.key === 'productKey'
                                        ? activeState.filters.productKey
                                        : '-'
                          : row.dimensions[column.key] || '-'}
                      </td>
                    ))}
                    {activeState.selectedMeasures.map((measure) => (
                      <td key={`${rowIndex}-${measure}`} className="border-b border-slate-100 px-3 py-2 font-medium text-slate-900">
                        {Number(row.measures[measure] || 0).toLocaleString('vi-VN')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {showTotalsRow ? (
                <tfoot className="sticky bottom-0 bg-slate-100 text-slate-800">
                  <tr>
                    {tableColumns.map((column, columnIndex) => (
                      <td key={`total-label-${column.key}`} className="border-t border-slate-300 px-3 py-2 font-semibold">
                        {columnIndex === 0 ? 'Tổng' : '-'}
                      </td>
                    ))}
                    {activeState.selectedMeasures.map((measure) => (
                      <td key={`total-${measure}`} className="border-t border-slate-300 px-3 py-2 font-semibold text-slate-900">
                        {Number(measureTotals[measure] || 0).toLocaleString('vi-VN')}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        )}
      </div>

      <ChartDisplayPanel
        chartType={activeState.chartType}
        tableColumns={tableColumns}
        filteredRows={filteredRows}
        selectedMeasures={activeState.selectedMeasures}
        filters={activeState.filters}
        isLoading={activeState.dataLoading}
      />
    </section>
  )
}

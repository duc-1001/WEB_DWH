import { ChartDisplayPanel } from './chart-display-panel'
import { MeasureChartConfigPanel } from './measure-chart-config'
import type { ChartType } from './measure-chart-config'

type FactKey = 'fact_sales' | 'fact_inventory'

type DimensionMeta = {
  name: string
  hierarchy: string[]
  hierarchyUniqueName: string
}

type MeasureMeta = {
  name: string
  uniqueName: string
}

type FilterState = {
  year: string
  quarter: string
  month: string
  state: string
  city: string
  customerType: string
  productKey: string
}

type CubeRow = {
  dimensions: Record<string, string>
  measures: Record<string, number | string>
}

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
  return (
    <section className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:p-4">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-800">Cấu hình dữ liệu</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(factConfig) as FactKey[]).map((factKey) => (
            <button
              key={factKey}
              onClick={() => setActiveFact(factKey)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                activeFact === factKey
                  ? 'border-emerald-700 bg-emerald-700 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {factConfig[factKey].label}
            </button>
          ))}
        </div>
      </div>

      {activeState.errorMessage ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">{activeState.errorMessage}</div>
      ) : null}

      <div>
        <div className="rounded-xl border border-slate-200 p-2.5">
          <h3 className="mb-2 text-xs font-semibold text-slate-800">Chiều dữ liệu - {factConfig[activeFact].label}</h3>
          {activeState.metaLoading ? (
            <div className="mb-3 space-y-2">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : null}
          <div className="mb-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs font-medium text-slate-600">
              <span>Chiều đang bật</span>
              <select
                value=""
                onChange={(event) => {
                  const dimensionName = event.target.value
                  if (dimensionName) {
                    toggleDimension(dimensionName)
                    event.currentTarget.value = ''
                  }
                }}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
              >
                <option value="">Thêm chiều</option>
                {availableDimensionOptions.map((dimension) => (
                  <option key={dimension.name} value={dimension.name}>
                    {formatDimLabel(dimension.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeState.selectedDimensions.length > 0 ? (
                activeState.selectedDimensions.map((dimensionName) => (
                  <button
                    key={dimensionName}
                    type="button"
                    onClick={() => toggleDimension(dimensionName)}
                    className="rounded-full border border-emerald-700 bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-800"
                  >
                    {formatDimLabel(dimensionName)}
                  </button>
                ))
              ) : (
                <span className="text-xs text-slate-500">Chưa chọn chiều nào.</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
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
                    className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                  >
                    <div className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                      <span className="flex-1 leading-5">
                        <span className="block text-xs font-semibold text-slate-800">{formatDimLabel(dimension.name)}</span>
                        <span className="block text-xs text-slate-500">Không bắt buộc chọn, chỉ chọn level khi cần drill-down</span>
                      </span>
                      {isDimensionSelected ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow-sm">
                          {selectedLevelIndexes.length} cấp
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2.5 space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
                      {selectedLevelLabels.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedLevelLabels.map((label) => (
                            <span
                              key={label}
                              className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {allowedLevelIndexes.length > 0 ? (
                          allowedLevelIndexes.map((index) => {
                            const level = dimension.hierarchy[index]
                            const checked = selectedLevelIndexes.includes(index)
                            return (
                              <label
                                key={level}
                                className="flex cursor-pointer items-center gap-2 rounded-xl border border-transparent bg-white px-2.5 py-1.5 text-xs text-slate-700 transition hover:border-emerald-100 hover:bg-emerald-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                  onChange={() => toggleDimensionLevel(dimension.name, index)}
                                />
                                <span className="truncate">{level}</span>
                              </label>
                            )
                          })
                        ) : (
                          <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                            Không có cấp dữ liệu phù hợp.
                          </p>
                        )}
                      </div>

                      {selectedLevelIndexes.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                          {selectedLevelIndexes.map((levelIndex) => {
                            const levelName = dimension.hierarchy[levelIndex]
                            const fieldKey = getDimensionFieldKey(dimension, levelIndex)
                            const memberQueryKey = `${dimension.name}::${levelIndex}`

                            return (
                              <div key={fieldKey} className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <div className="text-xs font-semibold text-slate-800">{levelName}</div>
                                    <div className="text-xs text-slate-500">Nhập thủ công giá trị member để lọc</div>
                                  </div>
                                </div>
                                <input
                                  value={memberSearchQueries[memberQueryKey] || ''}
                                  onChange={(event) => updateMemberSearchQuery(dimension.name, levelIndex, event.target.value)}
                                  className="mt-2 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none transition focus:border-emerald-500"
                                  placeholder={`Nhập member ${levelName}`}
                                />
                              </div>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            {activeState.selectedDimensions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                Chưa chọn chiều nào để hiển thị.
              </div>
            ) : null}
          </div>
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

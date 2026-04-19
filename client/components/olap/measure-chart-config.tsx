type MeasureOption = {
  name: string
  uniqueName: string
}

export type ChartType = 'bar' | 'line' | 'area' | 'stackedBar' | 'pie'

type ChartTypeOption = {
  value: ChartType
  label: string
}

const CHART_TYPE_OPTIONS: ChartTypeOption[] = [
  { value: 'bar', label: 'Biểu đồ cột' },
  { value: 'line', label: 'Biểu đồ đường' },
  { value: 'area', label: 'Biểu đồ miền' },
  { value: 'stackedBar', label: 'Biểu đồ cột chồng' },
  { value: 'pie', label: 'Biểu đồ tròn' },
]

type MeasureChartConfigProps = {
  factLabel: string
  measures: MeasureOption[]
  selectedMeasures: string[]
  chartType: ChartType
  onToggleMeasure: (name: string) => void
  onChartTypeChange: (nextType: ChartType) => void
  dimensionCount: number
  hasTimeDimension: boolean
}

export function normalizeChartType(value: string): ChartType {
  if (value === 'line' || value === 'area' || value === 'stackedBar' || value === 'pie') {
    return value
  }

  return 'bar'
}

function getRecommendedChartTypes(dimensionCount: number, measureCount: number, hasTimeDimension: boolean): ChartType[] {
  if (dimensionCount <= 1 && measureCount <= 1) {
    return hasTimeDimension ? ['line', 'area', 'bar'] : ['bar', 'pie', 'line']
  }

  if (dimensionCount <= 1 && measureCount > 1) {
    return hasTimeDimension ? ['line', 'area', 'stackedBar'] : ['bar', 'stackedBar', 'line']
  }

  if (dimensionCount >= 2 && measureCount <= 1) {
    return ['bar', 'line', 'pie']
  }

  return ['stackedBar', 'bar', 'line']
}

export function MeasureChartConfigPanel({
  factLabel,
  measures,
  selectedMeasures,
  chartType,
  onToggleMeasure,
  onChartTypeChange,
  dimensionCount,
  hasTimeDimension,
}: MeasureChartConfigProps) {
  const recommendedTypes = getRecommendedChartTypes(dimensionCount, selectedMeasures.length, hasTimeDimension)

  return (
    <div className="rounded-xl border border-slate-200 p-2.5">
      <h3 className="mb-2 text-xs font-semibold text-slate-800">Chỉ số và biểu đồ - {factLabel}</h3>

      <div className="mb-3 rounded-md border border-slate-200 p-2">
        <p className="mb-2 text-xs text-slate-600">Chọn nhiều chỉ số</p>
        <div className="max-h-40 space-y-1.5 overflow-auto pr-1 text-xs">
          {measures.map((measure) => (
            <label key={measure.uniqueName} className="flex items-center gap-2 text-slate-700">
              <input
                type="checkbox"
                checked={selectedMeasures.includes(measure.name)}
                onChange={() => onToggleMeasure(measure.name)}
              />
              <span>{measure.name}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="mb-3 block text-xs">
        <span className="mb-1 block text-slate-600">Loại biểu đồ</span>
        <select
          value={chartType}
          onChange={(event) => onChartTypeChange(normalizeChartType(event.target.value))}
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5"
        >
          {CHART_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="mb-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
        Trục X lấy chiều dữ liệu đầu tiên đã chọn. Trục Y thể hiện tổng giá trị của các chỉ số đã chọn.
      </div>

      <div className="rounded-lg border border-slate-100 bg-white p-3">
        <p className="mb-2 text-xs font-semibold text-slate-700">Gợi ý nhanh theo tổ hợp hiện tại</p>
        <div className="flex flex-wrap gap-2">
          {recommendedTypes.map((type) => {
            const option = CHART_TYPE_OPTIONS.find((item) => item.value === type)
            if (!option) {
              return null
            }

            return (
              <button
                key={type}
                type="button"
                onClick={() => onChartTypeChange(type)}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                  chartType === type
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

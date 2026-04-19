import { 
  BarChart2, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  AreaChart as AreaChartIcon,
  BarChart,
  Check,
  TrendingUp,
  Activity,
  Box
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type MeasureOption = {
  name: string
  uniqueName: string
}

export type ChartType = 'bar' | 'line' | 'area' | 'stackedBar' | 'pie'

type ChartTypeOption = {
  value: ChartType
  label: string
  icon: any
}

const CHART_TYPE_OPTIONS: ChartTypeOption[] = [
  { value: 'bar', label: 'Cột', icon: BarChart2 },
  { value: 'line', label: 'Đường', icon: LineChartIcon },
  { value: 'area', label: 'Miền', icon: AreaChartIcon },
  { value: 'stackedBar', label: 'Cột chồng', icon: BarChart },
  { value: 'pie', label: 'Tròn', icon: PieChartIcon },
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
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
            <TrendingUp size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Chỉ số & Biểu đồ</h3>
            <p className="text-[11px] text-slate-500">{factLabel}</p>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-4">
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            1. Chọn chỉ số
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {measures.map((measure) => {
              const isSelected = selectedMeasures.includes(measure.name)
              return (
                <button
                  key={measure.uniqueName}
                  onClick={() => onToggleMeasure(measure.name)}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg border text-left transition-all ${
                    isSelected 
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-900 shadow-sm' 
                    : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:border-indigo-100 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <div className={`p-1 rounded-md ${isSelected ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-400'}`}>
                      <Activity size={10} />
                    </div>
                    <span className="text-[10px] font-bold truncate uppercase">{measure.name}</span>
                  </div>
                  {isSelected && <Check size={12} className="text-indigo-600 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            2. Loại biểu đồ
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {CHART_TYPE_OPTIONS.map((option) => {
              const isSelected = chartType === option.value
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => onChartTypeChange(option.value)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all gap-1 ${
                    isSelected
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50'
                  }`}
                  title={option.label}
                >
                  <Icon size={14} />
                  <span className="text-[9px] font-bold uppercase">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-900">
           <Box size={10} className="text-amber-600 flex-shrink-0" />
           <p className="text-[9px] font-medium leading-tight">
             Trục X: chiều đầu tiên. Trục Y: giá trị chỉ số.
           </p>
        </div>

        <div className="pt-1">
          <div className="flex flex-wrap gap-1">
            {recommendedTypes.map((type) => {
              const option = CHART_TYPE_OPTIONS.find((item) => item.value === type)
              if (!option) return null
              const Icon = option.icon

              return (
                <Badge
                  key={type}
                  variant={chartType === type ? "default" : "outline"}
                  className={`px-2 py-0.5 cursor-pointer transition-all gap-1 text-[9px] font-bold uppercase ${
                    chartType === type 
                    ? 'bg-indigo-600 hover:bg-indigo-700 border-transparent' 
                    : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                  }`}
                  onClick={() => onChartTypeChange(type)}
                >
                  <Icon size={10} />
                  <span>{option.label}</span>
                </Badge>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

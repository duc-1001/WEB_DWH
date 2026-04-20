import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartType } from './measure-chart-config'
import {
  TableColumn,
  CubeRow,
  FilterState,
} from '../../types/olap'


type ChartDisplayPanelProps = {
  chartType: ChartType
  tableColumns: TableColumn[]
  filteredRows: CubeRow[]
  selectedMeasures: string[]
  filters: FilterState
  isLoading: boolean
}

const CHART_COLORS = ['#0f766e', '#0284c7', '#be123c', '#9333ea', '#ca8a04', '#334155']
const AXIS_TICK = { fill: '#4b5563', fontSize: 10 }
const AXIS_LABEL_FONT_SIZE = 11
const LEGEND_STYLE = { fontSize: 11 }
const MAIN_CHART_MARGIN = { top: 42, right: 18, left: 26, bottom: 46 }
const SUB_CHART_MARGIN = { top: 10, right: 12, left: 26, bottom: 38 }

function formatAxisTick(value: string | number, maxLength = 14) {
  const text = String(value || '')
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength - 1)}…`
}

function formatMeasureLabel(value: string) {
  const normalized = normalizeText(value)
  if (normalized.includes('quantity ordered')) {
    return 'Số lượng đặt'
  }

  if (normalized.includes('total amount')) {
    return 'Tổng tiền'
  }

  if (normalized.includes('quantity on hand')) {
    return 'Số lượng hàng còn lại'
  }

  return String(value || 'Giá trị')
}

function formatCategoryLabelByAxis(value: string | number, axisLabel: string) {
  const raw = normalizeChartLabel(String(value || ''))
  const axis = normalizeText(axisLabel)

  if (axis.includes('month') || axis.includes('tháng')) {
    return `Tháng ${formatMonthLabel(raw)}`
  }

  if (axis.includes('quarter') || axis.includes('quý')) {
    return formatQuarterLabel(raw)
  }

  if (axis.includes('year') || axis.includes('năm')) {
    return `Năm ${raw}`
  }

  return raw
}

function parseMeasureValue(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  const raw = String(value || '').trim()
  if (!raw) {
    return 0
  }

  const compact = raw.replace(/\s+/g, '')

  if (compact.includes('.') && compact.includes(',')) {
    const normalized = compact.replace(/\./g, '').replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (compact.includes(',')) {
    const normalized = compact.replace(/\./g, '').replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (compact.includes('.')) {
    const dotCount = compact.split('.').length - 1
    if (dotCount > 1) {
      const parsed = Number(compact.replace(/\./g, ''))
      return Number.isFinite(parsed) ? parsed : 0
    }

    const parts = compact.split('.')
    if (parts.length === 2 && parts[1].length === 3 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
      const parsed = Number(parts[0] + parts[1])
      return Number.isFinite(parsed) ? parsed : 0
    }
  }

  const parsed = Number(compact)
  return Number.isFinite(parsed) ? parsed : 0
}

function getColumnValue(row: CubeRow, column: TableColumn, filters: FilterState) {
  if (column.source === 'dimension') {
    return String(row.dimensions?.[column.key] || 'N/A')
  }

  // Helper: render array filter value as readable string
  const arrStr = (v: string | string[]) =>
    Array.isArray(v) ? (v.length > 0 ? v.join(', ') : 'N/A') : String(v || 'N/A')

  if (column.key === 'year') return arrStr(filters.year)
  if (column.key === 'quarter') return arrStr(filters.quarter)
  if (column.key === 'month') return arrStr(filters.month)
  if (column.key === 'state') return arrStr(filters.state)
  if (column.key === 'city') return arrStr(filters.city)
  if (column.key === 'customerType') return filters.customerType
  if (column.key === 'productKey') return filters.productKey

  return 'N/A'
}

function normalizeText(value: string) {
  return String(value || '').trim().toLowerCase()
}

function normalizeChartLabel(value: string) {
  const text = String(value || '').trim()
  return text || 'N/A'
}

function isYearColumn(column: TableColumn) {
  const text = `${column.label} ${column.key}`.toLowerCase()
  return text.includes('year') || text.includes('năm')
}

function isQuarterColumn(column: TableColumn) {
  const text = `${column.label} ${column.key}`.toLowerCase()
  return text.includes('quarter') || text.includes('quý')
}

function isMonthColumn(column: TableColumn) {
  const text = `${column.label} ${column.key}`.toLowerCase()
  return text.includes('month') || text.includes('tháng')
}

function isCustomerColumn(column: TableColumn) {
  const text = `${column.label} ${column.key}`.toLowerCase()
  return text.includes('customer name')
}

function isCustomerTypeColumn(column: TableColumn) {
  const text = `${column.label} ${column.key}`.toLowerCase()
  return text.includes('customer type')
}

function isProductColumn(column: TableColumn) {
  const text = `${column.label} ${column.key}`.toLowerCase()
  return text.includes('product key') || text.includes('mã sản phẩm')
}

function isStoreColumn(column: TableColumn) {
  const text = `${column.label} ${column.key}`.toLowerCase()
  return text.includes('store') || text.includes('office address') || text.includes('cửa hàng') || text.includes('chi nhánh')
}

function isStateColumn(column: TableColumn) {
  const text = `${column.label} ${column.key}`.toLowerCase()
  return text.includes('state') || text.includes('tiểu bang')
}

function monthOrder(value: string) {
  const normalized = normalizeText(value)
  const monthNumber = Number(normalized)
  if (Number.isFinite(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
    return monthNumber
  }

  const monthMap: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  }

  return monthMap[normalized] || 999
}

function formatMonthLabel(value: string) {
  const normalized = String(value || '').trim()
  if (!normalized) {
    return ''
  }

  const numeric = Number(normalized)
  if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 12) {
    return String(numeric).padStart(2, '0')
  }

  return normalized
}

function formatQuarterLabel(value: string) {
  const normalized = String(value || '').trim()
  if (!normalized) {
    return ''
  }

  const numeric = Number(normalizeText(normalized).replace(/^q/i, ''))
  if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 4) {
    return `Q${numeric}`
  }

  return normalized
}

function getTimeLabelParts(row: CubeRow, filters: FilterState, timeColumns: TableColumn[]) {
  const yearColumn = timeColumns.find(isYearColumn)
  const quarterColumn = timeColumns.find(isQuarterColumn)
  const monthColumn = timeColumns.find(isMonthColumn)

  const rawYear = yearColumn ? getColumnValue(row, yearColumn, filters) : ''
  const rawQuarter = quarterColumn ? getColumnValue(row, quarterColumn, filters) : ''
  const rawMonth = monthColumn ? getColumnValue(row, monthColumn, filters) : ''

  const yearNorm = normalizeChartLabel(rawYear)
  const quarterNorm = normalizeChartLabel(rawQuarter)
  const monthNorm = normalizeChartLabel(rawMonth)

  const yearValue = yearNorm === 'N/A' ? '' : yearNorm
  const quarterValue = quarterNorm === 'N/A' ? '' : quarterNorm
  const monthValue = monthNorm === 'N/A' ? '' : monthNorm

  return { yearValue, quarterValue, monthValue }
}

function buildTimeAxisLabel(row: CubeRow, filters: FilterState, timeColumns: TableColumn[]) {
  const { yearValue, quarterValue, monthValue } = getTimeLabelParts(row, filters, timeColumns)
  const parts: string[] = []

  if (yearValue) {
    parts.push(yearValue)
  }

  if (quarterValue && !monthValue) {
    parts.push(formatQuarterLabel(quarterValue))
  }

  if (monthValue) {
    parts.push(formatMonthLabel(monthValue))
  }

  if (parts.length === 0 && quarterValue) {
    parts.push(formatQuarterLabel(quarterValue))
  }

  if (parts.length === 0 && monthValue) {
    parts.push(formatMonthLabel(monthValue))
  }

  return parts.join(' / ') || 'N/A'
}

function buildTimeAxisSortKey(row: CubeRow, filters: FilterState, timeColumns: TableColumn[]) {
  const { yearValue, quarterValue, monthValue } = getTimeLabelParts(row, filters, timeColumns)
  const yearNumber = Number(yearValue)
  const quarterNumber = Number(normalizeText(quarterValue).replace(/^q/i, ''))
  const monthNumber = monthOrder(monthValue)

  if (Number.isFinite(yearNumber) && yearNumber > 0 && monthNumber >= 1 && monthNumber <= 12) {
    return `${String(yearNumber).padStart(4, '0')}-${String(monthNumber).padStart(2, '0')}`
  }

  if (Number.isFinite(yearNumber) && yearNumber > 0 && quarterNumber >= 1 && quarterNumber <= 4) {
    return `${String(yearNumber).padStart(4, '0')}-Q${quarterNumber}`
  }

  if (Number.isFinite(yearNumber) && yearNumber > 0) {
    return `Y${String(yearNumber).padStart(4, '0')}`
  }

  if (quarterNumber >= 1 && quarterNumber <= 4) {
    return `Q${quarterNumber}`
  }

  if (monthNumber >= 1 && monthNumber <= 12) {
    return `M${String(monthNumber).padStart(2, '0')}`
  }

  return 'N/A'
}

function sortTimeAxisData(data: Array<{ name: string; value: number }>) {
  return [...data].sort((left, right) => {
    const leftParts = left.name.split(' / ')
    const rightParts = right.name.split(' / ')

    const leftYear = Number(leftParts[0] || 0)
    const rightYear = Number(rightParts[0] || 0)
    if (leftYear !== rightYear) {
      return leftYear - rightYear
    }

    const leftMonth = leftParts[leftParts.length - 1] || ''
    const rightMonth = rightParts[rightParts.length - 1] || ''
    const leftMonthOrder = monthOrder(leftMonth)
    const rightMonthOrder = monthOrder(rightMonth)
    if (leftMonthOrder !== rightMonthOrder) {
      return leftMonthOrder - rightMonthOrder
    }

    const leftQuarterOrder = quarterOrder(leftMonth)
    const rightQuarterOrder = quarterOrder(rightMonth)
    return leftQuarterOrder - rightQuarterOrder
  })
}

function quarterOrder(value: string) {
  const normalized = normalizeText(value)
  const numeric = Number(normalized.replace('q', ''))
  if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 4) {
    return numeric
  }
  return 99
}

function sortByTimeLabel(data: Array<{ name: string; value: number }>, timeKind: 'year' | 'quarter' | 'month') {
  if (timeKind === 'year') {
    return [...data].sort((left, right) => Number(left.name) - Number(right.name))
  }

  if (timeKind === 'quarter') {
    return [...data].sort((left, right) => quarterOrder(left.name) - quarterOrder(right.name))
  }

  return [...data].sort((left, right) => monthOrder(left.name) - monthOrder(right.name))
}

function sortChartRowsByTime(
  data: Array<Record<string, number | string>>,
  timeKind: 'year' | 'quarter' | 'month',
) {
  return [...data].sort((left, right) => {
    const leftLabel = normalizeChartLabel(String(left.label || ''))
    const rightLabel = normalizeChartLabel(String(right.label || ''))

    if (timeKind === 'year') {
      return Number(leftLabel) - Number(rightLabel)
    }

    if (timeKind === 'quarter') {
      return quarterOrder(leftLabel) - quarterOrder(rightLabel)
    }

    return monthOrder(leftLabel) - monthOrder(rightLabel)
  })
}

function aggregateMeasureByColumn(
  rows: CubeRow[],
  column: TableColumn,
  measure: string,
  filters: FilterState,
  topN?: number,
  timeKind?: 'year' | 'quarter' | 'month',
) {
  const bucket = new Map<string, number>()

  for (const row of rows) {
    const name = getColumnValue(row, column, filters)
    const numeric = parseMeasureValue(row.measures?.[measure])
    if (!Number.isFinite(numeric)) {
      continue
    }

    bucket.set(name, Number(bucket.get(name) || 0) + numeric)
  }

  let result = Array.from(bucket.entries()).map(([name, value]) => ({ name, value }))

  if (timeKind) {
    result = sortByTimeLabel(result, timeKind)
  } else {
    result = result.sort((left, right) => right.value - left.value)
  }

  if (typeof topN === 'number' && result.length > topN) {
    return result.slice(0, topN)
  }

  return result
}

function aggregateMeasureByTimeAxis(rows: CubeRow[], measure: string, filters: FilterState, timeColumns: TableColumn[]) {
  const bucket = new Map<string, { name: string; value: number }>()

  for (const row of rows) {
    const name = buildTimeAxisLabel(row, filters, timeColumns)
    const sortKey = buildTimeAxisSortKey(row, filters, timeColumns)
    const numeric = parseMeasureValue(row.measures?.[measure])
    if (!Number.isFinite(numeric)) {
      continue
    }

    const existing = bucket.get(sortKey) || { name, value: 0 }
    existing.value += numeric
    existing.name = name
    bucket.set(sortKey, existing)
  }

  return sortTimeAxisData(Array.from(bucket.values()))
}

function getColumnPriority(column: TableColumn) {
  if (isMonthColumn(column)) {
    return 100
  }
  if (isQuarterColumn(column)) {
    return 95
  }
  if (isYearColumn(column)) {
    return 90
  }
  if (isProductColumn(column)) {
    return 80
  }
  if (isCustomerColumn(column)) {
    return 75
  }
  if (isCustomerTypeColumn(column)) {
    return 60
  }

  return 50
}

function chooseBestChartColumn(rows: CubeRow[], columns: TableColumn[], filters: FilterState) {
  if (columns.length === 0) {
    return null
  }

  let best: TableColumn | null = null
  let bestScore = -Infinity

  for (const column of columns) {
    const distinct = new Set(rows.map((row) => getColumnValue(row, column, filters)))
    const distinctCount = distinct.size
    const variabilityScore = distinctCount > 1 ? 30 : 0
    const filterPenalty = column.source === 'filter' && distinctCount <= 1 ? 20 : 0
    const score = getColumnPriority(column) + variabilityScore - filterPenalty

    if (score > bestScore) {
      bestScore = score
      best = column
    }
  }

  return best || columns[0]
}

function getMeasureRange(rows: CubeRow[], measure: string) {
  let max = 0
  for (const row of rows) {
    const numeric = parseMeasureValue(row.measures?.[measure])
    if (numeric > max) {
      max = numeric
    }
  }

  return max
}

function getDistinctValueCount(rows: CubeRow[], column: TableColumn | null | undefined, filters: FilterState) {
  if (!column) {
    return 0
  }

  return new Set(rows.map((row) => getColumnValue(row, column, filters))).size
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/80 ${className || ''}`} />
}

export function ChartDisplayPanel({
  chartType,
  tableColumns,
  filteredRows,
  selectedMeasures,
  filters,
  isLoading,
}: ChartDisplayPanelProps) {
  const primaryMeasure = selectedMeasures[0]
  const timeColumns = tableColumns.filter((col) => isMonthColumn(col) || isQuarterColumn(col) || isYearColumn(col))
  const categoryColumns = tableColumns.filter((col) => !isMonthColumn(col) && !isQuarterColumn(col) && !isYearColumn(col))
  
  const monthColumn = timeColumns.find(isMonthColumn)
  const quarterColumn = timeColumns.find(isQuarterColumn)
  const yearColumn = timeColumns.find(isYearColumn)

  const timeColumn = monthColumn || quarterColumn || yearColumn
  const timeKind: 'year' | 'quarter' | 'month' | null = monthColumn
    ? 'month'
    : quarterColumn
      ? 'quarter'
      : yearColumn
        ? 'year'
        : null

  const chartData = useMemo(() => {
    if (filteredRows.length === 0 || tableColumns.length === 0 || selectedMeasures.length === 0) {
      return [] as Array<Record<string, number | string>>
    }

    const chartKey = chooseBestChartColumn(filteredRows, tableColumns, filters)
    if (!chartKey) {
      return [] as Array<Record<string, number | string>>
    }
    const bucket = new Map<string, Record<string, number | string>>()

    for (const row of filteredRows) {
      const label = normalizeChartLabel(getColumnValue(row, chartKey, filters))
      const existing = bucket.get(label) || { label }

      for (const measureName of selectedMeasures) {
        const currentValue = parseMeasureValue(existing[measureName] as number | string)
        const numeric = parseMeasureValue(row.measures?.[measureName])
        existing[measureName] = currentValue + (Number.isFinite(numeric) ? numeric : 0)
      }

      bucket.set(label, existing)
    }

    const aggregated = Array.from(bucket.values())

    if (isMonthColumn(chartKey)) {
      return sortChartRowsByTime(aggregated, 'month')
    }

    if (isQuarterColumn(chartKey)) {
      return sortChartRowsByTime(aggregated, 'quarter')
    }

    if (isYearColumn(chartKey)) {
      return sortChartRowsByTime(aggregated, 'year')
    }

    return aggregated
  }, [filteredRows, tableColumns, selectedMeasures, filters])

  const pieChartData = useMemo(() => {
    if (selectedMeasures.length === 0 || chartData.length === 0) {
      return [] as Array<{ name: string; value: number }>
    }

    const firstMeasure = selectedMeasures[0]
    return chartData
      .map((item) => ({
        name: String(item.label || 'N/A'),
        value: parseMeasureValue(item[firstMeasure] as number | string),
      }))
      .filter((item) => Number.isFinite(item.value) && item.value > 0)
      .slice(0, 10)
  }, [chartData, selectedMeasures])

  const chartXAxisColumn = chooseBestChartColumn(filteredRows, tableColumns, filters)
  const xAxisLabel = chartXAxisColumn?.label || tableColumns[0]?.label || 'Danh mục'
  const yAxisLabel = selectedMeasures.length > 0 ? selectedMeasures.join(', ') : 'Giá trị'
  const yAxisDisplayLabel = selectedMeasures.length > 0 ? selectedMeasures.map(formatMeasureLabel).join(', ') : 'Giá trị'
  const mainXAxisKey = chartXAxisColumn?.key || ''
  const timeXAxisKey = timeColumn?.key || ''
  
  type SubChartConfig = 
    | { type: 'trend', id: string, title: string, data: any[], xAxisLabel: string, yAxisLabel: string, measureName: string }
    | { type: 'top-bar', id: string, title: string, data: any[], xAxisLabel: string, yAxisLabel: string, isVertical: boolean, measureName: string }
    | { type: 'category-time', id: string, title: string, data: any[], xAxisLabel: string, yAxisLabel: string, categories: string[], measureName: string }
    | { type: 'pie', id: string, title: string, data: any[], xAxisLabel: string, measureName: string }
    
  const dynamicCharts = useMemo(() => {
    if (selectedMeasures.length === 0 || filteredRows.length === 0) return [] as SubChartConfig[];
    
    const charts: SubChartConfig[] = [];
    
    // Generate dynamic charts for each selected measure
    for (const measure of selectedMeasures) {
      const measureLabel = formatMeasureLabel(measure);
      
      // 1. Trend Chart (if time dimension exists)
      if (timeColumn && timeKind && mainXAxisKey !== timeColumn.key) {
        const trendData = aggregateMeasureByTimeAxis(filteredRows, measure, filters, timeColumns);
        if (trendData.length > 1) {
          charts.push({
            type: 'trend',
            id: `trend-${measure}-${timeColumn.key}`,
            title: `Xu hướng ${measureLabel} theo thời gian`,
            data: trendData,
            xAxisLabel: timeKind === 'month' ? 'Tháng' : timeKind === 'quarter' ? 'Quý' : 'Năm',
            yAxisLabel: measureLabel,
            measureName: measure
          });
        }
      }
      
      // 2. Top-N and Category-Time Charts
      for (const categoryCol of categoryColumns) {
        if (categoryCol.key === mainXAxisKey) continue;
        
        const distinctCount = getDistinctValueCount(filteredRows, categoryCol, filters);
        if (distinctCount <= 1) continue;
        
        // Top 10 Bar Chart
        const topNData = aggregateMeasureByColumn(filteredRows, categoryCol, measure, filters, 10);
        if (topNData.length > 0) {
          const isCustomerOrStore = categoryCol.label.toLowerCase().includes('khách hàng') || 
                                   categoryCol.label.toLowerCase().includes('customer') || 
                                   categoryCol.label.toLowerCase().includes('store') || 
                                   categoryCol.label.toLowerCase().includes('cửa hàng');
          
          charts.push({
            type: 'top-bar',
            id: `top-${measure}-${categoryCol.key}`,
            title: `Top 10 theo ${categoryCol.label} (${measureLabel})`,
            data: topNData,
            xAxisLabel: isCustomerOrStore ? measureLabel : categoryCol.label,
            yAxisLabel: isCustomerOrStore ? categoryCol.label : measureLabel,
            isVertical: isCustomerOrStore,
            measureName: measure
          });
        }
        
        // Top 5 Categories Over Time
        if (timeColumn && timeKind) {
          const top5Categories = aggregateMeasureByColumn(filteredRows, categoryCol, measure, filters, 5).map(item => item.name);
          
          if (top5Categories.length > 0) {
            const timeLabels = aggregateMeasureByTimeAxis(filteredRows, measure, filters, timeColumns).map(item => item.name);
            const byTime = new Map<string, Record<string, number | string>>();
            
            for (const label of timeLabels) {
              const seed: Record<string, number | string> = { label };
              for (const cat of top5Categories) seed[cat] = 0;
              byTime.set(label, seed);
            }
            
            for (const row of filteredRows) {
               const timeLabel = buildTimeAxisLabel(row, filters, timeColumns);
               const catValue = getColumnValue(row, categoryCol, filters);
               if (!top5Categories.includes(catValue)) continue;
               
               const numeric = parseMeasureValue(row.measures?.[measure]);
               if (!Number.isFinite(numeric)) continue;
               
               const current = byTime.get(timeLabel);
               if (current) {
                  current[catValue] = Number(current[catValue] || 0) + numeric;
               }
            }
            
            const catTimeData = Array.from(byTime.values());
            if (catTimeData.length > 0) {
               charts.push({
                 type: 'category-time',
                 id: `time-${measure}-${categoryCol.key}`,
                 title: `Biến động Top 5 ${categoryCol.label} theo thời gian (${measureLabel})`,
                 data: catTimeData,
                 xAxisLabel: timeKind === 'month' ? 'Tháng' : timeKind === 'quarter' ? 'Quý' : 'Năm',
                 yAxisLabel: measureLabel,
                 categories: top5Categories,
                 measureName: measure
               });
            }
          }
        }
      }
      
      // 3. Composition Pie Chart
      if (chartType !== 'pie' && chartXAxisColumn) {
         const distinctCount = getDistinctValueCount(filteredRows, chartXAxisColumn, filters);
         if (distinctCount > 1 && distinctCount <= 8 && chartXAxisColumn.key !== timeColumn?.key) {
             const pieData = aggregateMeasureByColumn(filteredRows, chartXAxisColumn, measure, filters, 8);
             if (pieData.length > 0) {
                 charts.push({
                    type: 'pie',
                    id: `pie-${measure}-${chartXAxisColumn.key}`,
                    title: `Cơ cấu ${measureLabel} theo ${chartXAxisColumn.label}`,
                    data: pieData,
                    xAxisLabel: chartXAxisColumn.label,
                    measureName: measure
                 });
             }
         }
      }
    }
    
    return charts;
  }, [filteredRows, selectedMeasures, timeColumns, categoryColumns, chartXAxisColumn, timeColumn, timeKind, filters, chartType, mainXAxisKey]);

  const chartTypeLabel =
    chartType === 'line'
      ? 'Biểu đồ đường'
      : chartType === 'area'
        ? 'Biểu đồ miền'
        : chartType === 'stackedBar'
          ? 'Biểu đồ cột chồng'
          : chartType === 'pie'
            ? 'Biểu đồ tròn'
            : 'Biểu đồ cột'
  const mainChartTitle = `${chartTypeLabel} theo ${xAxisLabel} (${yAxisDisplayLabel})`
  const mainChartMeasures = selectedMeasures
  const useDualAxis = chartType !== 'stackedBar' && mainChartMeasures.length >= 2 && getMeasureRange(filteredRows, mainChartMeasures[0]) > 0
  const primaryYAxisId = 'left'
  const secondaryYAxisId = 'right'

  return (
    <div className="mt-5 rounded-xl border border-slate-200 p-3">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Biểu đồ</h3>
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-slate-500">Không có dữ liệu để vẽ biểu đồ.</p>
      ) : (
        <div>
          <h4 className="mb-2 text-[11px] font-semibold text-slate-700">{mainChartTitle}</h4>
          <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            {chartType === 'line' ? (
              <LineChart data={chartData} margin={MAIN_CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe2e8" />
                <XAxis
                  dataKey="label"
                  tick={AXIS_TICK}
                  tickFormatter={(value) => formatAxisTick(value, 16)}
                  interval="preserveStartEnd"
                  minTickGap={18}
                  angle={-15}
                  textAnchor="end"
                  height={48}
                  label={{ value: `Trục X: ${xAxisLabel}`, position: 'bottom', offset: 16, fontSize: AXIS_LABEL_FONT_SIZE }}
                />
                <YAxis
                  yAxisId={primaryYAxisId}
                  tick={AXIS_TICK}
                  width={56}
                  label={{ value: `Trục Y trái: ${formatMeasureLabel(mainChartMeasures[0] || yAxisLabel)}`, angle: -90, position: 'left', offset: 6, fontSize: AXIS_LABEL_FONT_SIZE }}
                />
                {useDualAxis ? (
                  <YAxis
                    yAxisId={secondaryYAxisId}
                    orientation="right"
                    tick={AXIS_TICK}
                    width={56}
                    label={{ value: `Trục Y phải: ${formatMeasureLabel(mainChartMeasures[1] || '')}`, angle: 90, position: 'right', offset: 6, fontSize: AXIS_LABEL_FONT_SIZE }}
                  />
                ) : null}
                <Tooltip />
                <Legend verticalAlign="top" align="right" wrapperStyle={LEGEND_STYLE} formatter={(value) => formatMeasureLabel(String(value || ''))} />
                {selectedMeasures.map((measure, index) => (
                  <Line
                    key={measure}
                    type="monotone"
                    dataKey={measure}
                    yAxisId={useDualAxis && index === 1 ? secondaryYAxisId : primaryYAxisId}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            ) : chartType === 'area' ? (
              <AreaChart data={chartData} margin={MAIN_CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe2e8" />
                <XAxis
                  dataKey="label"
                  tick={AXIS_TICK}
                  tickFormatter={(value) => formatAxisTick(value, 16)}
                  interval="preserveStartEnd"
                  minTickGap={18}
                  angle={-15}
                  textAnchor="end"
                  height={48}
                  label={{ value: `Trục X: ${xAxisLabel}`, position: 'bottom', offset: 16, fontSize: AXIS_LABEL_FONT_SIZE }}
                />
                <YAxis
                  yAxisId={primaryYAxisId}
                  tick={AXIS_TICK}
                  width={56}
                  label={{ value: `Trục Y trái: ${formatMeasureLabel(mainChartMeasures[0] || yAxisLabel)}`, angle: -90, position: 'left', offset: 6, fontSize: AXIS_LABEL_FONT_SIZE }}
                />
                {useDualAxis ? (
                  <YAxis
                    yAxisId={secondaryYAxisId}
                    orientation="right"
                    tick={AXIS_TICK}
                    width={56}
                    label={{ value: `Trục Y phải: ${formatMeasureLabel(mainChartMeasures[1] || '')}`, angle: 90, position: 'right', offset: 6, fontSize: AXIS_LABEL_FONT_SIZE }}
                  />
                ) : null}
                <Tooltip />
                <Legend verticalAlign="top" align="right" wrapperStyle={LEGEND_STYLE} formatter={(value) => formatMeasureLabel(String(value || ''))} />
                {selectedMeasures.map((measure, index) => (
                  <Area
                    key={measure}
                    type="monotone"
                    dataKey={measure}
                    yAxisId={useDualAxis && index === 1 ? secondaryYAxisId : primaryYAxisId}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            ) : chartType === 'stackedBar' ? (
              <BarChart data={chartData} margin={MAIN_CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe2e8" />
                <XAxis
                  dataKey="label"
                  tick={AXIS_TICK}
                  tickFormatter={(value) => formatAxisTick(value, 16)}
                  interval="preserveStartEnd"
                  minTickGap={18}
                  angle={-15}
                  textAnchor="end"
                  height={48}
                  label={{ value: `Trục X: ${xAxisLabel}`, position: 'bottom', offset: 16, fontSize: AXIS_LABEL_FONT_SIZE }}
                />
                <YAxis
                  yAxisId={primaryYAxisId}
                  tick={AXIS_TICK}
                  width={56}
                  label={{ value: `Trục Y trái: ${formatMeasureLabel(mainChartMeasures[0] || yAxisLabel)}`, angle: -90, position: 'left', offset: 6, fontSize: AXIS_LABEL_FONT_SIZE }}
                />
                {useDualAxis ? (
                  <YAxis
                    yAxisId={secondaryYAxisId}
                    orientation="right"
                    tick={AXIS_TICK}
                    width={56}
                    label={{ value: `Trục Y phải: ${formatMeasureLabel(mainChartMeasures[1] || '')}`, angle: 90, position: 'right', offset: 6, fontSize: AXIS_LABEL_FONT_SIZE }}
                  />
                ) : null}
                <Tooltip />
                <Legend verticalAlign="top" align="right" wrapperStyle={LEGEND_STYLE} formatter={(value) => formatMeasureLabel(String(value || ''))} />
                {selectedMeasures.map((measure, index) => (
                  <Bar
                    key={measure}
                    stackId="total"
                    dataKey={measure}
                    yAxisId={useDualAxis && index === 1 ? secondaryYAxisId : primaryYAxisId}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    radius={[6, 6, 0, 0]}
                  />
                ))}
              </BarChart>
            ) : chartType === 'pie' ? (
              <PieChart>
                <Tooltip labelFormatter={(value) => formatCategoryLabelByAxis(String(value || ''), xAxisLabel)} />
                <Legend verticalAlign="top" align="right" wrapperStyle={LEGEND_STYLE} formatter={(value) => formatMeasureLabel(String(value || ''))} />
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label
                >
                  {pieChartData.map((item, index) => (
                    <Cell key={`${item.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            ) : (
              <BarChart data={chartData} margin={MAIN_CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe2e8" />
                <XAxis
                  dataKey="label"
                  tick={AXIS_TICK}
                  tickFormatter={(value) => formatAxisTick(value, 16)}
                  interval="preserveStartEnd"
                  minTickGap={18}
                  angle={-15}
                  textAnchor="end"
                  height={48}
                  label={{ value: `Trục X: ${xAxisLabel}`, position: 'bottom', offset: 16, fontSize: AXIS_LABEL_FONT_SIZE }}
                />
                <YAxis
                  yAxisId={primaryYAxisId}
                  tick={AXIS_TICK}
                  width={56}
                  label={{ value: `Trục Y trái: ${formatMeasureLabel(mainChartMeasures[0] || yAxisLabel)}`, angle: -90, position: 'left', offset: 6, fontSize: AXIS_LABEL_FONT_SIZE }}
                />
                {useDualAxis ? (
                  <YAxis
                    yAxisId={secondaryYAxisId}
                    orientation="right"
                    tick={AXIS_TICK}
                    width={56}
                    label={{ value: `Trục Y phải: ${formatMeasureLabel(mainChartMeasures[1] || '')}`, angle: 90, position: 'right', offset: 6, fontSize: AXIS_LABEL_FONT_SIZE }}
                  />
                ) : null}
                <Tooltip />
                <Legend verticalAlign="top" align="right" wrapperStyle={LEGEND_STYLE} formatter={(value) => formatMeasureLabel(String(value || ''))} />
                {selectedMeasures.map((measure, index) => (
                  <Bar
                    key={measure}
                    dataKey={measure}
                    yAxisId={useDualAxis && index === 1 ? secondaryYAxisId : primaryYAxisId}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    radius={[6, 6, 0, 0]}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
          </div>
        </div>
      )}

      {!isLoading && chartData.length > 0 ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-3">
            <h4 className="mb-1 text-xs font-semibold text-emerald-800">Bộ biểu đồ phù hợp tự động</h4>
            <p className="text-xs text-emerald-700">
              Dựa theo trường dữ liệu đang chọn và measure hiện tại để ưu tiên biểu đồ dễ đọc.
            </p>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            {dynamicCharts.map((chartConfig) => {
              if (chartConfig.type === 'trend') {
                return (
                  <div key={chartConfig.id} className="rounded-lg border border-slate-100 p-3">
                    <h4 className="mb-2 text-[11px] font-semibold text-slate-700">{chartConfig.title}</h4>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <LineChart data={chartConfig.data} margin={SUB_CHART_MARGIN}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#dbe2e8" />
                          <XAxis
                            dataKey="name"
                            tick={AXIS_TICK}
                            height={42}
                            label={{ value: `Trục X: ${chartConfig.xAxisLabel}`, position: 'bottom', offset: 12, fontSize: AXIS_LABEL_FONT_SIZE }}
                          />
                          <YAxis
                            tick={AXIS_TICK}
                            width={56}
                            label={{ value: `Trục Y: ${chartConfig.yAxisLabel}`, angle: -90, position: 'left', offset: 6, fontSize: AXIS_LABEL_FONT_SIZE }}
                          />
                          <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
                          <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              }

              if (chartConfig.type === 'top-bar') {
                if (chartConfig.isVertical) {
                  return (
                    <div key={chartConfig.id} className="rounded-lg border border-slate-100 p-3">
                      <h4 className="mb-2 text-[11px] font-semibold text-slate-700">{chartConfig.title}</h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                          <BarChart data={chartConfig.data} layout="vertical" margin={{ top: 10, right: 12, left: 34, bottom: 36 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#dbe2e8" />
                            <XAxis
                              type="number"
                              tick={AXIS_TICK}
                              label={{ value: `Trục X: ${chartConfig.xAxisLabel}`, position: 'bottom', offset: 12, fontSize: AXIS_LABEL_FONT_SIZE }}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              tick={AXIS_TICK}
                              tickFormatter={(value) => formatAxisTick(value, 14)}
                              width={118}
                              label={{ value: `Trục Y: ${chartConfig.yAxisLabel}`, angle: -90, position: 'left', offset: 8, fontSize: AXIS_LABEL_FONT_SIZE }}
                            />
                            <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
                            <Bar dataKey="value" fill="#0284c7" radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={chartConfig.id} className="rounded-lg border border-slate-100 p-3">
                    <h4 className="mb-2 text-[11px] font-semibold text-slate-700">{chartConfig.title}</h4>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={chartConfig.data} margin={SUB_CHART_MARGIN}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#dbe2e8" />
                          <XAxis
                            dataKey="name"
                            tick={AXIS_TICK}
                            tickFormatter={(value) => formatAxisTick(value, 10)}
                            interval={0}
                            angle={-25}
                            textAnchor="end"
                            height={50}
                            label={{ value: `Trục X: ${chartConfig.xAxisLabel}`, position: 'bottom', offset: 14, fontSize: AXIS_LABEL_FONT_SIZE }}
                          />
                          <YAxis
                            tick={AXIS_TICK}
                            width={56}
                            label={{ value: `Trục Y: ${chartConfig.yAxisLabel}`, angle: -90, position: 'left', offset: 6, fontSize: AXIS_LABEL_FONT_SIZE }}
                          />
                          <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
                          <Bar dataKey="value" fill="#9333ea" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              }

              if (chartConfig.type === 'category-time') {
                return (
                  <div key={chartConfig.id} className="rounded-lg border border-slate-100 p-3">
                    <h4 className="mb-2 text-[11px] font-semibold text-slate-700">{chartConfig.title}</h4>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={chartConfig.data} margin={SUB_CHART_MARGIN}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#dbe2e8" />
                          <XAxis
                            dataKey="label"
                            tick={AXIS_TICK}
                            height={42}
                            label={{ value: `Trục X: ${chartConfig.xAxisLabel}`, position: 'bottom', offset: 12, fontSize: AXIS_LABEL_FONT_SIZE }}
                          />
                          <YAxis
                            tick={AXIS_TICK}
                            width={56}
                            label={{ value: `Trục Y: ${chartConfig.yAxisLabel}`, angle: -90, position: 'left', offset: 6, fontSize: AXIS_LABEL_FONT_SIZE }}
                          />
                          <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
                          <Legend wrapperStyle={LEGEND_STYLE} />
                          {chartConfig.categories.map((category, index) => (
                            <Bar
                              key={category}
                              stackId="stack"
                              dataKey={category}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              }

              if (chartConfig.type === 'pie') {
                return (
                  <div key={chartConfig.id} className="rounded-lg border border-slate-100 p-3">
                    <h4 className="mb-2 text-[11px] font-semibold text-slate-700">{chartConfig.title}</h4>
                    <p className="mb-2 text-[11px] text-slate-500">Chú giải theo màu: mỗi lát là một nhóm {chartConfig.xAxisLabel.toLowerCase()}.</p>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                          <Tooltip
                            labelFormatter={(value) => formatCategoryLabelByAxis(String(value || ''), chartConfig.xAxisLabel)}
                            formatter={(value) => Number(value).toLocaleString('vi-VN')}
                          />
                          <Legend
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={LEGEND_STYLE}
                            formatter={(value) => formatCategoryLabelByAxis(String(value || ''), chartConfig.xAxisLabel)}
                          />
                          <Pie
                            data={chartConfig.data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="46%"
                            outerRadius={85}
                            label={false}
                            labelLine={false}
                          >
                            {chartConfig.data.map((item, index) => (
                              <Cell key={`dynamic-pie-${item.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              }

              return null
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

import {
  DimensionMeta,
  FilterState,
  FilterUsageState,
  TableColumn,
  CubeRow,
  FactKey,
  FactState
} from '../types/olap'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'

export const FACT_CONFIG: Record<
  FactKey,
  {
    label: string
    factGroup: string
    dashboardId: string
    allowedMeasures: string[]
    allowedDimensions: string[]
    showTotalsRow: boolean
  }
> = {
  fact_sales: {
    label: 'Fact Sales',
    factGroup: 'Fact Sales',
    dashboardId: '1',
    allowedMeasures: ['Quantity Ordered', 'Total Amount'],
    allowedDimensions: ['DIM CUSTOMER', 'DIM PRODUCT'],
    showTotalsRow: true,
  },
  fact_inventory: {
    label: 'Fact Inventory',
    factGroup: 'Fact Inventory',
    dashboardId: '2',
    allowedMeasures: ['Quantity On Hand'],
    allowedDimensions: ['DIM PRODUCT', 'DIM STORE'],
    showTotalsRow: false,
  },
}

export const DEFAULT_FILTERS: FilterState = {
  year: [],
  quarter: [],
  month: [],
  state: [],
  city: [],
  customerType: 'all',
  productKey: '',
}

export const DEFAULT_FILTER_USAGE: FilterUsageState = {
  year: true,
  quarter: true,
  month: true,
  state: true,
  city: true,
  customerType: true,
  productKey: true,
}

export const QUARTER_OPTIONS = [
  { value: 'Q1', label: 'Quý 1' },
  { value: 'Q2', label: 'Quý 2' },
  { value: 'Q3', label: 'Quý 3' },
  { value: 'Q4', label: 'Quý 4' },
]

export const MONTH_OPTIONS = [
  { value: 'Jan', label: 'Tháng 1' },
  { value: 'Feb', label: 'Tháng 2' },
  { value: 'Mar', label: 'Tháng 3' },
  { value: 'Apr', label: 'Tháng 4' },
  { value: 'May', label: 'Tháng 5' },
  { value: 'Jun', label: 'Tháng 6' },
  { value: 'Jul', label: 'Tháng 7' },
  { value: 'Aug', label: 'Tháng 8' },
  { value: 'Sep', label: 'Tháng 9' },
  { value: 'Oct', label: 'Tháng 10' },
  { value: 'Nov', label: 'Tháng 11' },
  { value: 'Dec', label: 'Tháng 12' },
]

export const DIMENSION_ALLOWED_LEVELS: Record<string, string[]> = {
  'DIM CUSTOMER': ['CUSTOMER KEY', 'CUSTOMER NAME'],
  'DIM STORE': ['STORE KEY'],
  'DIM PRODUCT': ['PRODUCT KEY'],
}

export const DIMENSION_ALLOWED_TABLE_LEVELS: Record<string, string[]> = {
  'DIM CUSTOMER': ['CUSTOMER KEY', 'CUSTOMER NAME'],
  'DIM STORE': ['STORE KEY',"STATE","CITY"],
  "DIM LOCATION": ["STATE", "CITY"],
  "DIM TIME": ["YEAR", "QUARTER", "MONTH"],
  'DIM PRODUCT': ['PRODUCT KEY'],
}


export function getAllowedLevelIndexes(dimension: DimensionMeta) {
  const allowed = DIMENSION_ALLOWED_LEVELS[dimension.name]
  if (!allowed || allowed.length === 0) {
    return dimension.hierarchy.map((_, index) => index)
  }

  return dimension.hierarchy
    .map((level, index) => ({ level, index }))
    .filter((item) => allowed.includes(String(item.level || '').trim().toUpperCase()))
    .map((item) => item.index)
}

export function getNormalizedLevelIndexes(dimension: DimensionMeta, currentIndexes: number[] | number | undefined) {
  const allowedIndexes = getAllowedLevelIndexes(dimension)
  if (allowedIndexes.length === 0) {
    return []
  }

  const normalized = Array.isArray(currentIndexes)
    ? currentIndexes.filter((index) => allowedIndexes.includes(index))
    : typeof currentIndexes === 'number' && allowedIndexes.includes(currentIndexes)
      ? [currentIndexes]
      : []

  if (normalized.length > 0) {
    return normalized
  }

  return []
}

export function getSelectedLevelLabels(dimension: DimensionMeta, selectedLevelIndexes: number[]) {
  return selectedLevelIndexes
    .map((index) => dimension.hierarchy[index])
    .filter(Boolean)
}

export function getDimensionFieldKey(dimension: DimensionMeta, levelIndex: number) {
  const level = dimension.hierarchy[levelIndex]
  return `${dimension.name} / ${level}`
}

export function formatDimLabel(value: string) {
  const raw = String(value || '').trim()
  if (!raw) {
    return ''
  }

  const segments = raw
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean)

  if (segments.length > 1 && /^dim\b/i.test(segments[0])) {
    const label = segments.slice(1).join(' / ')
    return label.replace(/\bTime Key\b/gi, 'Ngày')
  }

  if (/^dim\b/i.test(raw)) {
    const label = raw.replace(/^dim\s*/i, '').trim()
    return label.replace(/\bTime Key\b/gi, 'Ngày')
  }

  return raw.replace(/\bTime Key\b/gi, 'Ngày')
}

export function isAllFilterValue(value: string | string[]) {
  if (Array.isArray(value)) return value.length === 0
  const normalized = String(value || '').trim().toLowerCase()
  return !normalized || normalized === 'all' || normalized === 'tất cả' || normalized === 'tat ca'
}

export function getEffectiveFilters(filters: FilterState, filterUsage: FilterUsageState): FilterState {
  return {
    year: filterUsage.year ? filters.year : [],
    quarter: filterUsage.quarter ? filters.quarter : [],
    month: filterUsage.month ? filters.month : [],
    state: filterUsage.state ? filters.state : [],
    city: filterUsage.city ? filters.city : [],
    customerType: filterUsage.customerType ? filters.customerType : 'all',
    productKey: filterUsage.productKey ? filters.productKey : 'all',
  }
}

export function getTableColumnsForFilters(filters: FilterState, filterUsage: FilterUsageState, rows: CubeRow[]): TableColumn[] {
  const columns: TableColumn[] = []
  const rowColumns = rows.length > 0 ? Object.keys(rows[0].dimensions || {}) : []
  const normalizedRowColumns = rowColumns.map((column) => String(column || '').trim().toLowerCase())

  const hasDimensionColumnForFilter = (filterKey: string) => {
    const normalizedFilter = filterKey.toLowerCase().replace(/\s+/g, '')

    return rowColumns.some((column) => {
      if (!column) return false

      const segments = column.split('/')
      const dimName = segments[0].trim().toUpperCase()

      const rawLevelName = segments[segments.length - 1].trim()
      const normalizedLevelName = rawLevelName.toLowerCase().replace(/\s+/g, '')

      // level phải khớp filter
      if (normalizedLevelName !== normalizedFilter) return false

      // kiểm tra restriction nếu dimension có rule
      const allowedForDim = DIMENSION_ALLOWED_TABLE_LEVELS[dimName]

      if (allowedForDim) {
        const normalizedAllowed = allowedForDim.map(level =>
          level.toLowerCase().replace(/\s+/g, '')
        )

        return normalizedAllowed.includes(normalizedLevelName)
      }

      return true
    })
  }

  const yearSelected = filterUsage.year && !isAllFilterValue(filters.year)
  const quarterSelected = filterUsage.quarter && !isAllFilterValue(filters.quarter)
  const quarterAll = filterUsage.quarter && isAllFilterValue(filters.quarter)
  const monthAll = filterUsage.month && isAllFilterValue(filters.month)

  if (yearSelected && !hasDimensionColumnForFilter('year')) {
    columns.push({ key: 'year', label: 'Năm', source: 'filter' })
  }

  if (filterUsage.quarter && !isAllFilterValue(filters.quarter) && !hasDimensionColumnForFilter('quarter')) {
    if (!columns.some((column) => column.key === 'year') && !hasDimensionColumnForFilter('year')) {
      columns.push({ key: 'year', label: 'Năm', source: 'filter' })
    }
    columns.push({ key: 'quarter', label: 'Quý', source: 'filter' })
  }

  if (yearSelected && quarterAll && !hasDimensionColumnForFilter('quarter')) {
    columns.push({ key: 'Dim Time / Quarter', label: 'Quý', source: 'dimension' })
  }

  if (filterUsage.month && !isAllFilterValue(filters.month) && !hasDimensionColumnForFilter('month')) {
    if (!columns.some((column) => column.key === 'year') && !hasDimensionColumnForFilter('year')) {
      columns.push({ key: 'year', label: 'Năm', source: 'filter' })
    }
    if (!columns.some((column) => column.key === 'quarter') && !hasDimensionColumnForFilter('quarter')) {
      columns.push({ key: 'quarter', label: 'Quý', source: 'filter' })
    }
    columns.push({ key: 'month', label: 'Tháng', source: 'filter' })
  }

  if (quarterSelected && monthAll && !hasDimensionColumnForFilter('month')) {
    columns.push({ key: 'Dim Time / Month', label: 'Tháng', source: 'dimension' })
  }

  if (filterUsage.state && !isAllFilterValue(filters.state) && !hasDimensionColumnForFilter('state')) {
    columns.push({ key: 'state', label: 'Tiểu bang', source: 'filter' })
  }

  if (filterUsage.city && !isAllFilterValue(filters.city) && !hasDimensionColumnForFilter('city')) {
    columns.push({ key: 'city', label: 'Thành phố', source: 'filter' })
  }

  if (filterUsage.customerType && !isAllFilterValue(filters.customerType)) {
    columns.push({ key: 'customerType', label: 'Customer Type', source: 'filter' })
  }

  if (filterUsage.productKey && String(filters.productKey || '').trim()) {
    columns.push({ key: 'productKey', label: 'Mã sản phẩm', source: 'filter' })
  }

  const addedFilterKeys = new Set(
    columns
      .filter((item) => item.source === 'filter')
      .map((item) => item.key.toLowerCase().replace(/\s+/g, ''))
  )

  for (const column of rowColumns) {
    if (columns.some((item) => item.key === column)) continue;

    const normalizedCol = column.toLowerCase().replace(/\s+/g, '')
    const segments = column.split('/')

    // Determine dimension name and level name for restriction check
    const dimName = segments[0].trim().toUpperCase()
    const rawLevelName = segments[segments.length - 1].trim()
    const normalizedLevelName = rawLevelName.toLowerCase().replace(/\s+/g, '')

    // Apply restriction only if the dimension is listed in DIMENSION_ALLOWED_TABLE_LEVELS
    const allowedForDim = DIMENSION_ALLOWED_TABLE_LEVELS[dimName]
    if (allowedForDim) {
      const normalizedAllowed = allowedForDim.map(name => name.toLowerCase().replace(/\s+/g, ''))
      if (!normalizedAllowed.includes(normalizedLevelName)) {
        continue
      }
    }

    if (addedFilterKeys.has(normalizedCol) || addedFilterKeys.has(normalizedLevelName)) continue

    columns.push({ key: column, label: formatDimLabel(column), source: 'dimension' });
  }

  return columns
}

export function getQueryableSelectedDimensions(state: FactState) {
  return (state.selectedDimensions || []).filter((name) => {
    const levels = state.currentLevels[name]
    return Array.isArray(levels) && levels.length > 0
  })
}

export function getQueryableCurrentLevels(state: FactState, selectedDimensions: string[]) {
  const levels: Record<string, number[]> = {}
  for (const name of selectedDimensions) {
    const currentLevels = state.currentLevels[name]
    if (Array.isArray(currentLevels) && currentLevels.length > 0) {
      levels[name] = currentLevels
    }
  }
  return levels
}

export function matchesSearchQuery(value: string, query: string) {
  const normalizedValue = String(value || '').trim().toLowerCase()
  const normalizedQuery = String(query || '').trim().toLowerCase()
  if (!normalizedQuery) return true
  if (normalizedValue === normalizedQuery) return true
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
  return tokens.every((token) => normalizedValue.includes(token))
}

export function filterRowsByMemberQueries(
  rows: CubeRow[],
  dimensions: DimensionMeta[],
  currentLevels: Record<string, number[]>,
  memberSearchQueries: Record<string, string>,
) {
  const activeSearches: Array<{ fieldKey: string; query: string }> = []
  for (const dimension of dimensions) {
    const selectedLevelIndexes = getNormalizedLevelIndexes(dimension, currentLevels[dimension.name])
    for (const levelIndex of selectedLevelIndexes) {
      const queryKey = `${dimension.name}::${levelIndex}`
      const query = String(memberSearchQueries[queryKey] || '').trim()
      if (!query) continue
      activeSearches.push({ fieldKey: getDimensionFieldKey(dimension, levelIndex), query })
    }
  }
  if (activeSearches.length === 0) return rows
  return rows.filter((row) =>
    activeSearches.every((search) => matchesSearchQuery(String(row.dimensions?.[search.fieldKey] || ''), search.query)),
  )
}

export async function apiFetch(path: string, init?: RequestInit) {
  const candidates = [String(API_BASE_URL || '').trim().replace(/\/$/, '') || 'http://localhost:4000']
  let lastError: unknown = null
  for (const baseUrl of candidates) {
    try {
      return await fetch(`${baseUrl}${path}`, init)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Không thể kết nối máy chủ API')
}

export function buildQueryString(value: string) {
  return encodeURIComponent(value)
}

export function arraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

export function shallowEqualStringArrays(left: Record<string, string[]>, right: Record<string, string[]>) {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  if (leftKeys.length !== rightKeys.length) return false
  return leftKeys.every((key) => arraysEqual(left[key] || [], right[key] || []))
}

export function createInitialFactState(): FactState {
  return {
    dimensions: [],
    measures: [],
    selectedDimensions: [],
    currentLevels: {},
    levelSearchQueries: {},
    memberSearchQueries: {},
    selectedMeasures: [],
    chartType: 'bar',
    filters: { ...DEFAULT_FILTERS },
    filterUsage: { ...DEFAULT_FILTER_USAGE },
    timeOptions: { years: [], quarters: [], months: [] },
    customerTypeOptions: [],
    locationOptions: { states: [], citiesByState: {} },
    rows: [],
    reports: [],
    reportName: '',
    metaLoading: false,
    dataLoading: false,
    tableLoading: false,
    saveLoading: false,
    errorMessage: '',
    metaLoaded: false,
  }
}

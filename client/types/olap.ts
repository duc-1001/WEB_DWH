import { ChartType } from '../components/olap/measure-chart-config'

export type DimensionMeta = {
  name: string
  hierarchy: string[]
  hierarchyUniqueName: string
}

export type MeasureMeta = {
  name: string
  uniqueName: string
}

export type CubeMetaResponse = {
  dimensions: DimensionMeta[]
  measures: MeasureMeta[]
  factGroup?: string
}

export type CustomerTypeOptionsResponse = {
  customerTypes?: string[]
}

export type CubeRow = {
  dimensions: Record<string, string>
  measures: Record<string, number | string>
}

export type TableColumn = {
  key: string
  label: string
  source: 'filter' | 'dimension'
}

export type CubeDataResponse = {
  rows: CubeRow[]
}

export type FilterState = {
  year: string
  quarter: string
  month: string
  state: string
  city: string
  customerType: string
  productKey: string
}

export type FilterUsageState = {
  year: boolean
  quarter: boolean
  month: boolean
  state: boolean
  city: boolean
  customerType: boolean
  productKey: boolean
}

export type FactKey = 'fact_sales' | 'fact_inventory'

export type ReportItem = {
  id: string
  name: string
  description: string
  createdAt: string
  config: {
    selectedDimensions?: string[]
    currentLevels?: Record<string, number[] | number>
    selectedMeasures?: string[]
    filters?: Record<string, string>
    filterUsage?: Partial<FilterUsageState>
    chartType?: ChartType
  }
}

export type FactState = {
  dimensions: DimensionMeta[]
  measures: MeasureMeta[]
  selectedDimensions: string[]
  currentLevels: Record<string, number[]>
  levelSearchQueries: Record<string, string>
  memberSearchQueries: Record<string, string>
  selectedMeasures: string[]
  chartType: ChartType
  filters: FilterState
  filterUsage: FilterUsageState
  timeOptions: {
    years: string[]
    quarters: string[]
    months: string[]
  }
  customerTypeOptions: string[]
  locationOptions: {
    states: string[]
    citiesByState: Record<string, string[]>
  }
  rows: CubeRow[]
  reports: ReportItem[]
  reportName: string
  metaLoading: boolean
  dataLoading: boolean
  tableLoading: boolean
  saveLoading: boolean
  errorMessage: string
  metaLoaded: boolean
}

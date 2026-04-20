'use client'

import { useEffect, useMemo } from 'react'
import { FactSalesPanel } from '../components/olap/fact-sales-panel'
import { FactInventoryPanel } from '../components/olap/fact-inventory-panel'
import { FilterSidebar } from '../components/olap/filter-sidebar'
import { useDebounce } from '../hooks/use-debounce'
import { useOlapFactState } from '../hooks/use-olap-fact-state'
import { FactKey } from '../types/olap'
import {
  FACT_CONFIG,
  DEFAULT_FILTERS,
  DEFAULT_FILTER_USAGE,
  getNormalizedLevelIndexes,
  getAllowedLevelIndexes,
  getSelectedLevelLabels,
  getDimensionFieldKey,
  formatDimLabel,
  getEffectiveFilters,
  getTableColumnsForFilters,
  filterRowsByMemberQueries,
  getQueryableSelectedDimensions,
  getQueryableCurrentLevels
} from '@/lib/olap-utils'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/80 ${className || ''}`} />
}


export default function Home() {
  const {
    activeFact,
    setActiveFact,
    factStates,
    activeState,
    updateActiveState,
    loadMeta,
    loadReports,
    loadCustomerTypeOptions,
    loadLocationOptions,
    loadTimeOptions,
    queryData
  } = useOlapFactState()

  useEffect(() => {
    void Promise.all(
      (Object.keys(FACT_CONFIG) as FactKey[]).map((fact) =>
        Promise.all([loadMeta(fact), loadReports(fact), loadCustomerTypeOptions(fact)]),
      ),
    )
  }, [])

  useEffect(() => {
    const state = factStates[activeFact]
    if (!state.metaLoaded && !state.metaLoading) {
      void loadMeta(activeFact)
      void loadReports(activeFact)
      void loadCustomerTypeOptions(activeFact)
    }
  }, [activeFact, factStates])

  const debouncedFilters = useDebounce(activeState.filters, 350)
  const debouncedFilterUsage = useDebounce(activeState.filterUsage, 350)
  const debouncedSelectedMeasures = useDebounce(activeState.selectedMeasures, 450)
  const debouncedMemberSearchQueries = useDebounce(activeState.memberSearchQueries, 450)

  useEffect(() => {
    if (!activeState.metaLoaded) return
    const debouncedSnapshot = {
      ...activeState,
      filters: getEffectiveFilters(debouncedFilters, debouncedFilterUsage),
      filterUsage: debouncedFilterUsage,
    }
    void loadTimeOptions(activeFact, debouncedSnapshot)
    void loadLocationOptions(activeFact, debouncedSnapshot)
  }, [activeFact, activeState.metaLoaded, debouncedFilters, debouncedFilterUsage])

  const queryableSelectedDimensions = useMemo(
    () => getQueryableSelectedDimensions(activeState),
    [activeState.selectedDimensions, activeState.currentLevels],
  )
  const queryableCurrentLevels = useMemo(
    () => getQueryableCurrentLevels(activeState, queryableSelectedDimensions),
    [activeState.currentLevels, queryableSelectedDimensions],
  )

  const querySignature = useMemo(() => {
    return JSON.stringify({
      fact: activeFact,
      dimensions: queryableSelectedDimensions,
      levels: queryableCurrentLevels,
      measures: debouncedSelectedMeasures,
      filters: getEffectiveFilters(debouncedFilters, debouncedFilterUsage),
      filterUsage: debouncedFilterUsage,
      metaLoaded: activeState.metaLoaded,
    })
  }, [activeFact, queryableSelectedDimensions, queryableCurrentLevels, debouncedSelectedMeasures, debouncedFilters, debouncedFilterUsage, activeState.metaLoaded])

  useEffect(() => {
    if (!activeState.metaLoaded) return
    void queryData(activeFact)
  }, [querySignature])

  const filteredRows = useMemo(() => {
    return filterRowsByMemberQueries(
      activeState.rows,
      activeState.dimensions,
      activeState.currentLevels,
      debouncedMemberSearchQueries || {},
    )
  }, [activeState.rows, activeState.dimensions, activeState.currentLevels, debouncedMemberSearchQueries])

  const tableColumns = useMemo(() => {
    return getTableColumnsForFilters(activeState.filters, activeState.filterUsage, filteredRows)
  }, [activeState.filters, activeState.filterUsage, filteredRows])

  const measureTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const measure of activeState.selectedMeasures) {
      totals[measure] = filteredRows.reduce((sum, row) => sum + Number(row.measures[measure] || 0), 0)
    }
    return totals
  }, [filteredRows, activeState.selectedMeasures])

  const showTotalsRow = useMemo(() => {
    return FACT_CONFIG[activeFact].showTotalsRow && filteredRows.length > 1 && activeState.selectedMeasures.length > 0
  }, [activeFact, filteredRows.length, activeState.selectedMeasures.length])

  const hasTimeDimension = useMemo(() => {
    return tableColumns.some((column) => {
      const normalizedLabel = `${column.label} ${column.key}`.toLowerCase()
      return normalizedLabel.includes('year') || normalizedLabel.includes('quarter') || normalizedLabel.includes('month') || normalizedLabel.includes('năm') || normalizedLabel.includes('quý') || normalizedLabel.includes('tháng')
    })
  }, [tableColumns])

  const isTimeFilterEnabled = activeState.filterUsage.year || activeState.filterUsage.quarter || activeState.filterUsage.month
  const isLocationFilterEnabled = activeState.filterUsage.state || activeState.filterUsage.city
  const availableDimensionOptions = activeState.dimensions.filter((item) => !activeState.selectedDimensions.includes(item.name))

  // Event Handlers
  function resetFilters() {
    updateActiveState((prev) => ({
      ...prev,
      filters: { ...DEFAULT_FILTERS },
      filterUsage: { ...DEFAULT_FILTER_USAGE },
    }))
  }

  function toggleTimeFilterUsage(checked: boolean) {
    updateActiveState((prev) => ({
      ...prev,
      filterUsage: {
        ...prev.filterUsage,
        year: checked,
        quarter: checked,
        month: checked,
      },
    }))
  }

  function toggleLocationFilterUsage(checked: boolean) {
    updateActiveState((prev) => ({
      ...prev,
      filterUsage: {
        ...prev.filterUsage,
        state: checked,
        city: checked,
      },
    }))
  }

  function toggleDimension(name: string) {
    updateActiveState((prev) => {
      const isAdding = !prev.selectedDimensions.includes(name)
      
      let nextLevels: number[] = []
      if (isAdding) {
        const dimension = prev.dimensions.find((d) => d.name === name)
        const allowedIndexes = dimension ? getAllowedLevelIndexes(dimension) : []
        if (allowedIndexes.length === 1) {
          nextLevels = [allowedIndexes[0]]
        }
      }

      return {
        ...prev,
        selectedDimensions: isAdding
          ? [...prev.selectedDimensions, name]
          : prev.selectedDimensions.filter((item) => item !== name),
        currentLevels: {
          ...prev.currentLevels,
          [name]: isAdding ? (nextLevels.length > 0 ? nextLevels : prev.currentLevels[name] || []) : [],
        },
        levelSearchQueries: {
          ...prev.levelSearchQueries,
          [name]: !isAdding ? '' : prev.levelSearchQueries[name] || '',
        },
        memberSearchQueries: { ...prev.memberSearchQueries, [name]: '' },
      }
    })
  }

  function toggleDimensionLevel(dimensionName: string, levelIndex: number) {
    updateActiveState((prev) => {
      const currentLevels = prev.currentLevels[dimensionName] || []
      const nextLevels = currentLevels.includes(levelIndex)
        ? currentLevels.filter((item) => item !== levelIndex)
        : [...currentLevels, levelIndex]
      return { ...prev, currentLevels: { ...prev.currentLevels, [dimensionName]: nextLevels } }
    })
  }

  function toggleMeasure(name: string) {
    updateActiveState((prev) => ({
      ...prev,
      selectedMeasures: prev.selectedMeasures.includes(name)
        ? prev.selectedMeasures.filter((item) => item !== name)
        : [...prev.selectedMeasures, name],
    }))
  }

  function updateMemberSearchQuery(dimensionName: string, levelIndex: number, value: string) {
    updateActiveState((prev) => ({
      ...prev,
      memberSearchQueries: {
        ...prev.memberSearchQueries,
        [`${dimensionName}::${levelIndex}`]: value,
      },
    }))
  }

  function onYearChange(val: string) {
    updateActiveState((prev) => {
      const current = prev.filters.year as string[]
      const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val]
      // Reset quarter/month that are no longer valid when year selection changes
      return { ...prev, filters: { ...prev.filters, year: next, quarter: [], month: [] } }
    })
  }

  function onQuarterChange(val: string) {
    updateActiveState((prev) => {
      const current = prev.filters.quarter as string[]
      const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val]
      return { ...prev, filters: { ...prev.filters, quarter: next, month: [] } }
    })
  }

  function onMonthChange(val: string) {
    updateActiveState((prev) => {
      const current = prev.filters.month as string[]
      const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val]
      return { ...prev, filters: { ...prev.filters, month: next } }
    })
  }

  function onStateChange(val: string) {
    updateActiveState((prev) => {
      const current = prev.filters.state as string[]
      const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val]
      // Remove cities that don't belong to any still-selected state
      const validCities = next.flatMap(s => prev.locationOptions.citiesByState[s] || [])
      const nextCity = (prev.filters.city as string[]).filter(c => validCities.includes(c))
      return { ...prev, filters: { ...prev.filters, state: next, city: nextCity } }
    })
  }

  function onCityChange(val: string) {
    updateActiveState((prev) => {
      const current = prev.filters.city as string[]
      const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val]
      return { ...prev, filters: { ...prev.filters, city: next } }
    })
  }

  if (!activeState.metaLoaded) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f4f7f4_0%,#eef3ef_100%)] p-4 text-slate-700 lg:p-6">
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-emerald-800">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
            <p className="text-lg font-medium">Đang tải cấu hình dữ liệu OLAP...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f7f4_0%,#eef3ef_100%)]">
      <div className="p-4 text-slate-700 lg:p-6">
        <main className="mx-auto flex w-full max-w-400 flex-col gap-4 lg:flex-row">
        <FilterSidebar
          activeFact={activeFact}
          activeState={activeState}
          isTimeFilterEnabled={isTimeFilterEnabled}
          isLocationFilterEnabled={isLocationFilterEnabled}
          yearOptions={activeState.timeOptions.years}
          quarterOptions={activeState.timeOptions.quarters}
          monthOptions={activeState.timeOptions.months}
          stateOptions={activeState.locationOptions.states}
          cityOptions={(activeState.filters.state as string[]).flatMap(s => activeState.locationOptions.citiesByState[s] || [])}
          customerTypeOptions={activeState.customerTypeOptions}
          onYearChange={onYearChange}
          onQuarterChange={onQuarterChange}
          onMonthChange={onMonthChange}
          onStateChange={onStateChange}
          onCityChange={onCityChange}
          onCustomerTypeChange={(val) => updateActiveState((prev) => ({ ...prev, filters: { ...prev.filters, customerType: val } }))}
          toggleTimeFilterUsage={toggleTimeFilterUsage}
          toggleLocationFilterUsage={toggleLocationFilterUsage}
          resetFilters={resetFilters}
          Skeleton={Skeleton}
        />

        {activeFact === 'fact_sales' ? (
          <FactSalesPanel
            activeFact={activeFact}
            factConfig={FACT_CONFIG}
            activeState={activeState}
            availableDimensionOptions={availableDimensionOptions}
            filteredRows={filteredRows}
            tableColumns={tableColumns}
            measureTotals={measureTotals}
            showTotalsRow={showTotalsRow}
            queryableDimensionCount={queryableSelectedDimensions.length}
            hasTimeDimension={hasTimeDimension}
            setActiveFact={setActiveFact}
            toggleDimension={toggleDimension}
            toggleDimensionLevel={toggleDimensionLevel}
            toggleMeasure={toggleMeasure}
            updateChartType={(nextType) => updateActiveState((prev) => ({ ...prev, chartType: nextType }))}
            updateMemberSearchQuery={updateMemberSearchQuery}
            getNormalizedLevelIndexes={getNormalizedLevelIndexes}
            getAllowedLevelIndexes={getAllowedLevelIndexes}
            getSelectedLevelLabels={getSelectedLevelLabels}
            getDimensionFieldKey={getDimensionFieldKey}
            formatDimLabel={formatDimLabel}
            Skeleton={Skeleton}
          />
        ) : (
          <FactInventoryPanel
            activeFact={activeFact}
            factConfig={FACT_CONFIG}
            activeState={activeState}
            availableDimensionOptions={availableDimensionOptions}
            filteredRows={filteredRows}
            tableColumns={tableColumns}
            measureTotals={measureTotals}
            showTotalsRow={showTotalsRow}
            queryableDimensionCount={queryableSelectedDimensions.length}
            hasTimeDimension={hasTimeDimension}
            setActiveFact={setActiveFact}
            toggleDimension={toggleDimension}
            toggleDimensionLevel={toggleDimensionLevel}
            toggleMeasure={toggleMeasure}
            updateChartType={(nextType) => updateActiveState((prev) => ({ ...prev, chartType: nextType }))}
            updateMemberSearchQuery={updateMemberSearchQuery}
            getNormalizedLevelIndexes={getNormalizedLevelIndexes}
            getAllowedLevelIndexes={getAllowedLevelIndexes}
            getSelectedLevelLabels={getSelectedLevelLabels}
            getDimensionFieldKey={getDimensionFieldKey}
            formatDimLabel={formatDimLabel}
            Skeleton={Skeleton}
          />
        )}
      </main>
      </div>
    </div>
  )
}

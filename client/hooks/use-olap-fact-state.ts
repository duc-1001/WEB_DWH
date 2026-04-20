import { useState, useEffect, useMemo } from 'react'
import { 
  FactKey, 
  FactState, 
  CubeMetaResponse, 
  CustomerTypeOptionsResponse, 
  CubeDataResponse,
  ReportItem
} from '../types/olap'
import {
  FACT_CONFIG,
  createInitialFactState,
  apiFetch,
  buildQueryString,
  getNormalizedLevelIndexes,
  arraysEqual,
  shallowEqualStringArrays,
  getEffectiveFilters,
  getQueryableSelectedDimensions,
  getQueryableCurrentLevels
} from '../lib/olap-utils'

export function useOlapFactState() {
  const [activeFact, setActiveFact] = useState<FactKey>('fact_sales')
  const [factStates, setFactStates] = useState<Record<FactKey, FactState>>({
    fact_sales: createInitialFactState(),
    fact_inventory: createInitialFactState(),
  })

  const activeState = factStates[activeFact]

  function updateFactState(fact: FactKey, updater: (prev: FactState) => FactState) {
    setFactStates((prev) => ({
      ...prev,
      [fact]: updater(prev[fact]),
    }))
  }

  function updateActiveState(updater: (prev: FactState) => FactState) {
    updateFactState(activeFact, updater)
  }

  async function loadMeta(fact: FactKey) {
    updateFactState(fact, (prev) => ({ ...prev, metaLoading: true, errorMessage: '' }))

    try {
      const factGroup = FACT_CONFIG[fact].factGroup
      const response = await apiFetch(`/api/cube/ui/meta?factGroup=${buildQueryString(factGroup)}`, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Không tải được siêu dữ liệu từ khối OLAP')
      }

      const payload = (await response.json()) as CubeMetaResponse
      const rawDimensions = Array.isArray(payload.dimensions) ? payload.dimensions : []
      const rawMeasures = Array.isArray(payload.measures) ? payload.measures : []
      const allowedMeasures = new Set(FACT_CONFIG[fact].allowedMeasures)
      const allowedDimensions = new Set(FACT_CONFIG[fact].allowedDimensions)
      const safeMeasures = rawMeasures.filter((item) => allowedMeasures.has(item.name))
      const safeDimensions = rawDimensions.filter((item) => allowedDimensions.has(item.name))

      updateFactState(fact, (prev) => {
        const nextCurrentLevels = Object.keys(prev.currentLevels).length > 0 ? { ...prev.currentLevels } : {}
        const safeLevelSearchQueries = prev.levelSearchQueries && typeof prev.levelSearchQueries === 'object'
          ? prev.levelSearchQueries
          : {}
        const safeMemberSearchQueries = prev.memberSearchQueries && typeof prev.memberSearchQueries === 'object'
          ? prev.memberSearchQueries
          : {}
        const nextLevelSearchQueries = Object.keys(safeLevelSearchQueries).length > 0 ? { ...safeLevelSearchQueries } : {}
        const nextMemberSearchQueries = Object.keys(safeMemberSearchQueries).length > 0 ? { ...safeMemberSearchQueries } : {}
        for (const item of safeDimensions) {
          nextCurrentLevels[item.name] = getNormalizedLevelIndexes(item, nextCurrentLevels[item.name])
          if (nextLevelSearchQueries[item.name] === undefined) {
            nextLevelSearchQueries[item.name] = ''
          }
          if (nextMemberSearchQueries[item.name] === undefined) {
            nextMemberSearchQueries[item.name] = ''
          }
        }

        const nextSelectedDimensions =
          prev.selectedDimensions.length > 0
            ? prev.selectedDimensions.filter((name) => safeDimensions.some((item) => item.name === name))
            : []

        const nextSelectedMeasures =
          prev.selectedMeasures.length > 0
            ? prev.selectedMeasures.filter((name) => safeMeasures.some((item) => item.name === name))
            : safeMeasures.slice(0, 1).map((item) => item.name)

        return {
          ...prev,
          dimensions: safeDimensions,
          measures: safeMeasures,
          selectedDimensions: nextSelectedDimensions,
          selectedMeasures: nextSelectedMeasures,
          currentLevels: nextCurrentLevels,
          levelSearchQueries: nextLevelSearchQueries,
          memberSearchQueries: nextMemberSearchQueries,
          metaLoading: false,
          metaLoaded: true,
        }
      })
    } catch (error) {
      updateFactState(fact, (prev) => ({
        ...prev,
        metaLoading: false,
        errorMessage: error instanceof Error ? error.message : 'Lỗi tải siêu dữ liệu',
      }))
    }
  }

  async function loadReports(fact: FactKey) {
    try {
      const dashboardId = FACT_CONFIG[fact].dashboardId
      const response = await apiFetch(`/api/catalog/reports?dashboardId=${buildQueryString(dashboardId)}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Không tải được cấu hình đã lưu')
      }

      const payload = (await response.json()) as { data?: ReportItem[] }
      updateFactState(fact, (prev) => ({ ...prev, reports: Array.isArray(payload.data) ? payload.data : [] }))
    } catch {
      updateFactState(fact, (prev) => ({ ...prev, reports: [] }))
    }
  }

  async function loadCustomerTypeOptions(fact: FactKey) {
    try {
      const response = await apiFetch('/api/cube/ui/customer-type-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factGroup: FACT_CONFIG[fact].factGroup,
        }),
      })

      const payload = (await response.json()) as CustomerTypeOptionsResponse

      if (!response.ok) {
        return
      }

      updateFactState(fact, (prev) => {
        const customerTypeOptions = Array.isArray(payload.customerTypes) ? payload.customerTypes : []
        const hasSelectedCustomerType = customerTypeOptions.includes(prev.filters.customerType)
        const nextCustomerType = prev.filters.customerType !== 'all' && hasSelectedCustomerType ? prev.filters.customerType : 'all'

        const customerTypeOptionsChanged = !arraysEqual(prev.customerTypeOptions, customerTypeOptions)
        const filterChanged = prev.filters.customerType !== nextCustomerType

        if (!customerTypeOptionsChanged && !filterChanged) {
          return prev
        }

        return {
          ...prev,
          ...(customerTypeOptionsChanged ? { customerTypeOptions } : {}),
          ...(filterChanged
            ? {
              filters: {
                ...prev.filters,
                customerType: nextCustomerType,
              },
            }
            : {}),
        }
      })
    } catch {
      // Keep previous options when request fails.
    }
  }

  async function loadLocationOptions(fact: FactKey, snapshot: FactState) {
    if (!snapshot?.metaLoaded) {
      return
    }

    try {
      const effectiveFilters = getEffectiveFilters(snapshot.filters, snapshot.filterUsage)
      const response = await apiFetch('/api/cube/ui/location-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factGroup: FACT_CONFIG[fact].factGroup,
          filters: effectiveFilters,
          filterUsage: snapshot.filterUsage,
        }),
      })

      const payload = (await response.json()) as {
        states?: string[]
        citiesByState?: Record<string, string[]>
      }

      if (!response.ok) {
        return
      }

      updateFactState(fact, (prev) => {
        const states = Array.isArray(payload.states) ? payload.states : []
        const citiesByState = payload.citiesByState && typeof payload.citiesByState === 'object'
          ? payload.citiesByState
          : {}

        // For multi-select: keep only valid selected states
        const nextState = (prev.filters.state as string[]).filter(s => states.includes(s))
        // Keep only valid cities for still-selected states
        const validCities = nextState.flatMap(s => citiesByState[s] || [])
        const nextCity = (prev.filters.city as string[]).filter(c => validCities.includes(c))

        const locationOptionsChanged =
          !arraysEqual(prev.locationOptions.states, states) ||
          !shallowEqualStringArrays(prev.locationOptions.citiesByState, citiesByState)

        const filtersChanged =
          !arraysEqual(prev.filters.state as string[], nextState) ||
          !arraysEqual(prev.filters.city as string[], nextCity)

        if (!locationOptionsChanged && !filtersChanged) {
          return prev
        }

        return {
          ...prev,
          ...(locationOptionsChanged
            ? {
              locationOptions: {
                states,
                citiesByState,
              },
            }
            : {}),
          ...(filtersChanged
            ? {
              filters: {
                ...prev.filters,
                state: nextState,
                city: nextCity,
              },
            }
            : {}),
        }
      })
    } catch {
      // Keep previous options when request fails.
    }
  }

  async function loadTimeOptions(fact: FactKey, snapshot: FactState) {
    if (!snapshot?.metaLoaded) {
      return
    }

    try {
      const effectiveFilters = getEffectiveFilters(snapshot.filters, snapshot.filterUsage)
      const response = await apiFetch('/api/cube/ui/time-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factGroup: FACT_CONFIG[fact].factGroup,
          filters: effectiveFilters,
          filterUsage: snapshot.filterUsage,
        }),
      })

      const payload = (await response.json()) as {
        years?: string[]
        quarters?: string[]
        months?: string[]
      }

      if (!response.ok) {
        return
      }

      updateFactState(fact, (prev) => {
        const years = Array.isArray(payload.years) ? payload.years : []
        const quarters = Array.isArray(payload.quarters) ? payload.quarters : []
        const months = Array.isArray(payload.months) ? payload.months : []

        const nextYear = (prev.filters.year as string[]).filter(y => years.includes(y))
        const nextQuarter = (prev.filters.quarter as string[]).filter(q => quarters.includes(q))
        const nextMonth = (prev.filters.month as string[]).filter(m => months.includes(m))

        const timeOptionsChanged =
          !arraysEqual(prev.timeOptions.years, years) ||
          !arraysEqual(prev.timeOptions.quarters, quarters) ||
          !arraysEqual(prev.timeOptions.months, months)

        const filtersChanged =
          !arraysEqual(prev.filters.year as string[], nextYear) ||
          !arraysEqual(prev.filters.quarter as string[], nextQuarter) ||
          !arraysEqual(prev.filters.month as string[], nextMonth)

        if (!timeOptionsChanged && !filtersChanged) {
          return prev
        }

        return {
          ...prev,
          ...(timeOptionsChanged
            ? {
              timeOptions: {
                years,
                quarters,
                months,
              },
            }
            : {}),
          ...(filtersChanged
            ? {
              filters: {
                ...prev.filters,
                year: nextYear,
                quarter: nextQuarter,
                month: nextMonth,
              },
            }
            : {}),
        }
      })
    } catch {
      // Keep previous options when request fails.
    }
  }

  async function queryData(fact: FactKey) {
    const snapshot = factStates[fact]
    const queryableSelectedDimensions = snapshot.selectedDimensions.filter((name) => {
      const levels = snapshot.currentLevels[name]
      return Array.isArray(levels) && levels.length > 0
    })
    
    const queryableCurrentLevels: Record<string, number[]> = {}
    for (const name of queryableSelectedDimensions) {
      const levels = snapshot.currentLevels[name]
      if (Array.isArray(levels) && levels.length > 0) {
        queryableCurrentLevels[name] = levels
      }
    }

    if (snapshot.selectedMeasures.length === 0) {
      updateFactState(fact, (prev) => ({
        ...prev,
        rows: [],
        errorMessage: 'Vui lòng chọn ít nhất 1 chỉ số',
      }))
      return
    }

    updateFactState(fact, (prev) => ({ ...prev, tableLoading: true, errorMessage: '' }))

    try {
      const effectiveFilters = getEffectiveFilters(snapshot.filters, snapshot.filterUsage)
      const response = await apiFetch('/api/cube/ui/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factGroup: FACT_CONFIG[fact].factGroup,
          selectedDimensions: queryableSelectedDimensions,
          selectedMeasures: snapshot.selectedMeasures,
          currentLevels: queryableCurrentLevels,
          filters: effectiveFilters,
          filterUsage: snapshot.filterUsage,
        }),
      })

      const payload = (await response.json()) as CubeDataResponse & { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Truy vấn dữ liệu thất bại')
      }

      updateFactState(fact, (prev) => ({
        ...prev,
        rows: Array.isArray(payload.rows) ? payload.rows : [],
        tableLoading: false,
      }))
    } catch (error) {
      updateFactState(fact, (prev) => ({
        ...prev,
        rows: [],
        tableLoading: false,
        errorMessage: error instanceof Error ? error.message : 'Lỗi truy vấn dữ liệu',
      }))
    }
  }

  async function saveCurrentConfig() {
    if (!activeState.reportName.trim()) {
      updateActiveState((prev) => ({ ...prev, errorMessage: 'Nhập tên cấu hình trước khi lưu' }))
      return
    }

    updateActiveState((prev) => ({ ...prev, saveLoading: true, errorMessage: '' }))

    try {
      const response = await apiFetch('/api/catalog/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardId: FACT_CONFIG[activeFact].dashboardId,
          name: activeState.reportName.trim(),
          description: `Lưu từ ${FACT_CONFIG[activeFact].label}`,
          config: {
            selectedDimensions: Array.isArray(activeState.selectedDimensions) ? activeState.selectedDimensions : [],
            currentLevels: activeState.currentLevels,
            selectedMeasures: activeState.selectedMeasures,
            filters: activeState.filters,
            filterUsage: activeState.filterUsage,
            chartType: activeState.chartType,
          },
        }),
      })

      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Lưu cấu hình thất bại')
      }

      updateActiveState((prev) => ({ ...prev, saveLoading: false, reportName: '' }))
      await loadReports(activeFact)
    } catch (error) {
      updateActiveState((prev) => ({
        ...prev,
        saveLoading: false,
        errorMessage: error instanceof Error ? error.message : 'Lỗi lưu cấu hình',
      }))
    }
  }

  return {
    activeFact,
    setActiveFact,
    factStates,
    activeState,
    updateActiveState,
    updateFactState,
    loadMeta,
    loadReports,
    loadCustomerTypeOptions,
    loadLocationOptions,
    loadTimeOptions,
    queryData,
    saveCurrentConfig
  }
}

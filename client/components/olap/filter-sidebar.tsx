'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Clock3, MapPin, RotateCcw, UsersRound, Filter as FilterIcon, ChevronDown, Check, X } from 'lucide-react'
import { FactKey, FactState, FilterUsageState } from '../../types/olap'
import { QUARTER_OPTIONS, MONTH_OPTIONS } from '@/lib/olap-utils'
import { JSX } from 'react'

// ─── MultiSelect Component ────────────────────────────────────────────────────

type MultiSelectProps = {
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (value: string) => void
  placeholder: string
  disabled?: boolean
  maxBadges?: number
}

function MultiSelect({ options, selected, onToggle, placeholder, disabled, maxBadges = 2 }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const toggle = useCallback(() => {
    if (!disabled) setOpen(prev => !prev)
  }, [disabled])

  const selectedLabels = selected.map(v => {
    const opt = options.find(o => o.value === v)
    return opt ? opt.label : v
  })

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={[
          'flex min-h-[2.5rem] w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-sm outline-none transition',
          'bg-white border-emerald-300',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:border-emerald-500 focus:border-emerald-500',
          open ? 'border-emerald-500 ring-2 ring-emerald-200' : '',
        ].join(' ')}
      >
        <span className="flex flex-1 flex-wrap gap-1 overflow-hidden">
          {selected.length === 0 ? (
            <span className="text-slate-400 leading-none my-0.5">{placeholder}</span>
          ) : selected.length <= maxBadges ? (
            selectedLabels.map((label, i) => (
              <span
                key={selected[i]}
                className="inline-flex items-center gap-0.5 rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800 leading-none"
              >
                {label}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggle(selected[i]) }}
                  className="ml-0.5 rounded-sm hover:text-emerald-600"
                  disabled={disabled}
                >
                  <X size={10} strokeWidth={2.5} />
                </button>
              </span>
            ))
          ) : (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800 leading-none">
              {selected.length} đã chọn
            </span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-emerald-600 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-emerald-200 bg-white shadow-xl">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">Không có lựa chọn</div>
          ) : (
            options.map(opt => {
              const isSelected = selected.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onToggle(opt.value)}
                  className={[
                    'flex w-full items-center gap-2 px-3 py-2 text-sm transition',
                    isSelected
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-700 hover:bg-emerald-50/60',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition',
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 bg-white',
                    ].join(' ')}
                  >
                    {isSelected && <Check size={10} strokeWidth={3} />}
                  </span>
                  {opt.label}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ─── FilterSidebar ────────────────────────────────────────────────────────────

type FilterSidebarProps = {
  activeFact: FactKey
  activeState: FactState
  isTimeFilterEnabled: boolean
  isLocationFilterEnabled: boolean
  yearOptions: string[]
  quarterOptions: string[]
  monthOptions: string[]
  stateOptions: string[]
  cityOptions: string[]
  customerTypeOptions: string[]
  onYearChange: (val: string) => void
  onQuarterChange: (val: string) => void
  onMonthChange: (val: string) => void
  onStateChange: (val: string) => void
  onCityChange: (val: string) => void
  onCustomerTypeChange: (val: string) => void
  toggleTimeFilterUsage: (checked: boolean) => void
  toggleLocationFilterUsage: (checked: boolean) => void
  resetFilters: () => void
  Skeleton: ({ className }: { className?: string }) => JSX.Element
}

export function FilterSidebar({
  activeFact,
  activeState,
  isTimeFilterEnabled,
  isLocationFilterEnabled,
  yearOptions,
  quarterOptions,
  monthOptions,
  stateOptions,
  cityOptions,
  customerTypeOptions,
  onYearChange,
  onQuarterChange,
  onMonthChange,
  onStateChange,
  onCityChange,
  onCustomerTypeChange,
  toggleTimeFilterUsage,
  toggleLocationFilterUsage,
  resetFilters,
  Skeleton,
}: FilterSidebarProps) {
  const selectedYears = activeState.filters.year as string[]
  const selectedQuarters = activeState.filters.quarter as string[]
  const selectedMonths = activeState.filters.month as string[]
  const selectedStates = activeState.filters.state as string[]
  const selectedCities = activeState.filters.city as string[]

  const yearOpts = yearOptions.map(y => ({ value: y, label: y }))
  const quarterOpts = quarterOptions.map(q => ({
    value: q,
    label: QUARTER_OPTIONS.find(o => o.value === q)?.label ?? q,
  }))
  const monthOpts = monthOptions.map(m => ({
    value: m,
    label: MONTH_OPTIONS.find(o => o.value === m)?.label ?? m,
  }))
  const stateOpts = stateOptions.map(s => ({ value: s, label: s }))
  const cityOpts = cityOptions.map(c => ({ value: c, label: c }))

  return (
    <aside className="w-full rounded-2xl border border-emerald-200 bg-[#c9d9cf] p-0 shadow-sm lg:sticky lg:top-6 lg:h-[calc(100vh-1.7rem)] lg:w-80 lg:self-start lg:overflow-y-auto">
      <div className="border-b border-emerald-300/70 px-5 py-4">
        <div className="flex items-center gap-2 text-[40px] font-semibold leading-none text-emerald-800">
          <FilterIcon size={22} />
          <h1 className="text-xl">BỘ LỌC</h1>
        </div>
      </div>

      <div className="space-y-6 px-5 py-4">
        {/* ── Thời gian ── */}
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-900">
            <Clock3 size={16} />
            Thời gian
            <label className="ml-auto flex items-center gap-1 text-xs font-medium normal-case tracking-normal text-emerald-800">
              <input
                type="checkbox"
                checked={isTimeFilterEnabled}
                onChange={(event) => toggleTimeFilterUsage(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-emerald-400 bg-white accent-emerald-600"
              />
              Bật
            </label>
          </h2>

          <div className="space-y-2">
            <label className="block space-y-1 text-sm">
              <span className="text-emerald-800">Năm</span>
              <MultiSelect
                options={yearOpts}
                selected={selectedYears}
                onToggle={onYearChange}
                placeholder="Tất cả năm"
                disabled={!isTimeFilterEnabled}
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-emerald-800">Quý</span>
              <MultiSelect
                options={quarterOpts}
                selected={selectedQuarters}
                onToggle={onQuarterChange}
                placeholder="Tất cả quý"
                disabled={!isTimeFilterEnabled}
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-emerald-800">Tháng</span>
              <MultiSelect
                options={monthOpts}
                selected={selectedMonths}
                onToggle={onMonthChange}
                placeholder="Tất cả tháng"
                disabled={!isTimeFilterEnabled}
              />
            </label>
          </div>
        </section>

        {/* ── Địa điểm ── */}
        <section className="space-y-3 border-t border-emerald-300/70 pt-4">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-900">
            <MapPin size={16} />
            Địa điểm
            <label className="ml-auto flex items-center gap-1 text-xs font-medium normal-case tracking-normal text-emerald-800">
              <input
                type="checkbox"
                checked={isLocationFilterEnabled}
                onChange={(event) => toggleLocationFilterUsage(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-emerald-400 bg-white accent-emerald-600"
              />
              Bật
            </label>
          </h2>

          <div className="space-y-2">
            <label className="block space-y-1 text-sm">
              <span className="text-emerald-800">Tiểu bang</span>
              <MultiSelect
                options={stateOpts}
                selected={selectedStates}
                onToggle={onStateChange}
                placeholder="Tất cả tiểu bang"
                disabled={!isLocationFilterEnabled}
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-emerald-800">Thành phố</span>
              <MultiSelect
                options={cityOpts}
                selected={selectedCities}
                onToggle={onCityChange}
                placeholder="Tất cả thành phố"
                disabled={!isLocationFilterEnabled || selectedStates.length === 0}
              />
            </label>
          </div>
        </section>

        {/* ── Khách hàng ── */}
        {activeFact === 'fact_sales' ? (
          <section className="space-y-3 border-t border-emerald-300/70 pt-4">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-900">
              <UsersRound size={16} />
              Khách hàng
            </h2>
            <div className="space-y-2 text-sm text-emerald-900">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="customer-type"
                  checked={activeState.filters.customerType === 'all'}
                  className="h-4 w-4 border-emerald-400 bg-white accent-emerald-600"
                  onChange={() => onCustomerTypeChange('all')}
                />
                Tất cả
              </label>
              {customerTypeOptions.length > 0 ? (
                customerTypeOptions.map((customerType) => (
                  <label key={customerType} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="customer-type"
                      checked={activeState.filters.customerType === customerType}
                      className="h-4 w-4 border-emerald-400 bg-white accent-emerald-600"
                      onChange={() => onCustomerTypeChange(customerType)}
                    />
                    {customerType}
                  </label>
                ))
              ) : activeState.metaLoading ? (
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <div className="grid gap-2 border-t border-emerald-300/70 pt-4">
          <button
            onClick={resetFilters}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white font-medium text-emerald-700 transition hover:bg-emerald-50"
          >
            <RotateCcw size={16} />
            Đặt lại bộ lọc
          </button>
        </div>
      </div>
    </aside>
  )
}

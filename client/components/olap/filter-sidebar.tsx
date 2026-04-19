import { Clock3, MapPin, RotateCcw, UsersRound, Filter as FilterIcon } from 'lucide-react'
import { FactKey, FactState, FilterUsageState } from '../../types/olap'
import { QUARTER_OPTIONS, MONTH_OPTIONS, isAllFilterValue } from '@/lib/olap-utils'
import { JSX } from 'react'

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
  return (
    <aside className="w-full rounded-2xl border border-emerald-200 bg-[#c9d9cf] p-0 shadow-sm lg:sticky lg:top-6 lg:h-[calc(100vh-1.7rem)] lg:w-80 lg:self-start lg:overflow-y-auto">
      <div className="border-b border-emerald-300/70 px-5 py-4">
        <div className="flex items-center gap-2 text-[40px] font-semibold leading-none text-emerald-800">
          <FilterIcon size={22} />
          <h1 className="text-2xl">BỘ LỌC</h1>
        </div>
      </div>

      <div className="space-y-6 px-5 py-4">
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
              Sử dụng
            </label>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-sm">
              <span className="text-emerald-800">Năm</span>
              <select
                value={activeState.filters.year}
                onChange={(event) => onYearChange(event.target.value)}
                disabled={!isTimeFilterEnabled}
                className="h-10 w-full rounded-lg border border-emerald-300 bg-white px-3 outline-none transition focus:border-emerald-500"
              >
                <option value="all">Tất cả</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-emerald-800">Quý</span>
              <select
                value={activeState.filters.quarter}
                onChange={(event) => onQuarterChange(event.target.value)}
                disabled={!isTimeFilterEnabled || (activeFact === 'fact_inventory' && isAllFilterValue(activeState.filters.year))}
                className="h-10 w-full rounded-lg border border-emerald-300 bg-white px-3 outline-none transition focus:border-emerald-500"
              >
                <option value="all">Tất cả quý</option>
                {quarterOptions.map((quarter) => (
                  <option key={quarter} value={quarter}>
                    {QUARTER_OPTIONS.find((item) => item.value === quarter)?.label || quarter}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="text-emerald-800">Tháng</span>
            <select
              value={activeState.filters.month}
              onChange={(event) => onMonthChange(event.target.value)}
              disabled={
                !isTimeFilterEnabled ||
                (activeFact === 'fact_inventory' && (isAllFilterValue(activeState.filters.year) || isAllFilterValue(activeState.filters.quarter)))
              }
              className="h-10 w-full rounded-lg border border-emerald-300 bg-white px-3 outline-none transition focus:border-emerald-500"
            >
              <option value="all">Tất cả tháng</option>
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {MONTH_OPTIONS.find((item) => item.value === month)?.label || month}
                </option>
              ))}
            </select>
          </label>
        </section>

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
              Sử dụng
            </label>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-sm">
              <span className="text-emerald-800">Tiểu bang</span>
              <select
                value={activeState.filters.state}
                onChange={(event) => onStateChange(event.target.value)}
                disabled={!isLocationFilterEnabled}
                className="h-10 w-full rounded-lg border border-emerald-300 bg-white px-3 outline-none transition focus:border-emerald-500"
              >
                <option value="">Tất cả</option>
                {stateOptions.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-emerald-800">Thành phố</span>
              <select
                value={activeState.filters.city}
                onChange={(event) => onCityChange(event.target.value)}
                disabled={!isLocationFilterEnabled || isAllFilterValue(activeState.filters.state)}
                className="h-10 w-full rounded-lg border border-emerald-300 bg-white px-3 outline-none transition focus:border-emerald-500"
              >
                <option value="">Tất cả</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

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

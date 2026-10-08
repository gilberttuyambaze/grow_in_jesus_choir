'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronDown,
  Check,
  Search,
  X,
  Calendar,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  MinusCircle
} from 'lucide-react'

export interface CustomSelectOption {
  value: string
  label: string
  sublabel?: string
  date?: string
  amount?: string
  category?: string
  type?: 'income' | 'expense' | 'neutral'
}

export interface CustomSelectProps {
  name?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  options: CustomSelectOption[]
  placeholder?: string
  id?: string
  required?: boolean
  disabled?: boolean
  className?: string
  searchable?: boolean
}

export function CustomSelect({
  name,
  value,
  defaultValue = '',
  onChange,
  options,
  placeholder = 'Select an option...',
  id,
  required = false,
  disabled = false,
  className = '',
  searchable = true
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isMounted, setIsMounted] = React.useState(false)

  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const [coords, setCoords] = React.useState<{
    top: number
    left: number
    width: number
    placeAbove: boolean
  } | null>(null)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const currentValue = value !== undefined ? value : internalValue

  const selectedOption = React.useMemo(() => {
    return options.find((opt) => opt.value === currentValue)
  }, [options, currentValue])

  // Compute portal coordinates when opening
  React.useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return

      const dropdownHeight = 320
      const spaceBelow = window.innerHeight - rect.bottom
      const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight

      setCoords({
        top: placeAbove ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 320),
        placeAbove
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  // Click outside and Escape key listeners
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Focus search input when opened
  React.useEffect(() => {
    if (isOpen && searchable && options.length > 4) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    } else {
      setSearchQuery('')
    }
  }, [isOpen, searchable, options.length])

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options
    const q = searchQuery.toLowerCase().trim()
    return options.filter((opt) => {
      const labelMatch = opt.label.toLowerCase().includes(q)
      const sublabelMatch = opt.sublabel?.toLowerCase().includes(q)
      const dateMatch = opt.date?.toLowerCase().includes(q)
      const amountMatch = opt.amount?.toLowerCase().includes(q)
      return labelMatch || sublabelMatch || dateMatch || amountMatch
    })
  }, [options, searchQuery])

  const handleSelect = (val: string) => {
    if (value === undefined) {
      setInternalValue(val)
    }
    onChange?.(val)
    setIsOpen(false)
  }

  const showSearch = searchable && options.length > 4

  return (
    <div className={`relative w-full ${className}`}>
      {/* Hidden input for HTML form submissions & FormData */}
      {name && (
        <input
          type="hidden"
          name={name}
          id={id}
          value={currentValue}
          required={required}
        />
      )}

      {/* Select trigger button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full p-2.5 sm:p-3 rounded-2xl border text-xs text-left transition-all flex items-center justify-between cursor-pointer select-none outline-none ${
          isOpen
            ? 'border-indigo-400 bg-white ring-4 ring-indigo-100/70 shadow-md'
            : 'border-slate-200/90 bg-white/80 hover:bg-white text-slate-900 shadow-xs hover:border-indigo-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {selectedOption ? (
            <>
              {selectedOption.value === '' ? (
                <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <MinusCircle className="w-3.5 h-3.5" />
                </div>
              ) : selectedOption.type === 'expense' ? (
                <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200/60">
                  <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              )}

              <div className="min-w-0 truncate">
                <span className="font-semibold text-slate-900 block truncate">
                  {selectedOption.label}
                </span>
                {(selectedOption.date || selectedOption.amount || selectedOption.sublabel) && (
                  <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                    {selectedOption.date && `${selectedOption.date} • `}
                    {selectedOption.sublabel && `${selectedOption.sublabel} `}
                    {selectedOption.amount && `(${selectedOption.amount})`}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="text-slate-400 truncate font-normal">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          {selectedOption && selectedOption.amount && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {selectedOption.amount}
            </span>
          )}
          <span className="p-1 rounded-lg text-slate-400 group-hover:text-slate-600">
            <ChevronDown
              className={`h-4 w-4 stroke-[2.2] transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-indigo-600' : ''
              }`}
            />
          </span>
        </div>
      </button>

      {/* Floating Dropdown via Portal (immune to overflow clipping and native select bugs) */}
      {isOpen &&
        isMounted &&
        coords &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: coords.placeAbove ? 'auto' : `${coords.top}px`,
              bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999
            }}
            className="rounded-[24px] bg-white/95 backdrop-blur-2xl border border-white/95 shadow-[0_20px_60px_-10px_rgba(15,23,42,0.25),0_0_0_1px_rgba(255,255,255,1)_inset] p-2 flex flex-col animate-in fade-in zoom-in-95 duration-150"
            role="listbox"
          >
            {/* Search filter pill */}
            {showSearch && (
              <div className="p-1 mb-1 border-b border-slate-100">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search records by name, date, or amount..."
                    className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50/80 rounded-xl border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/60"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="px-2 pt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{filteredOptions.length} available</span>
                  <span>Esc to close</span>
                </div>
              </div>
            )}

            {/* Options list */}
            <div className="overflow-y-auto max-h-64 overscroll-contain space-y-1 p-0.5">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-slate-400">
                  <p className="font-semibold text-slate-600">No matching records found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different term</p>
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === currentValue
                  const isNoneOption = option.value === ''

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      role="option"
                      aria-selected={isSelected}
                      className={`w-full p-2.5 rounded-2xl text-xs text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-50/90 to-purple-50/90 border border-indigo-200/90 text-indigo-950 shadow-xs'
                          : 'hover:bg-slate-50 hover:border-slate-200/60 border border-transparent text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isNoneOption ? (
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                            <MinusCircle className="w-4 h-4" />
                          </div>
                        ) : option.type === 'expense' ? (
                          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/70 shadow-xs">
                            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200/70 shadow-xs">
                            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <span
                            className={`block truncate ${
                              isSelected ? 'font-bold text-indigo-950' : 'font-semibold text-slate-900'
                            }`}
                          >
                            {option.label}
                          </span>

                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                            {option.date && (
                              <span className="font-medium text-slate-600">
                                {option.date}
                              </span>
                            )}
                            {option.sublabel && (
                              <span>• {option.sublabel}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {option.amount && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {option.amount}
                          </span>
                        )}

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

import React, { useMemo, useCallback, useRef, useEffect } from "react"
import { FieldValues, ControllerRenderProps } from "react-hook-form"

import { Popover, PopoverContent, PopoverTrigger } from "@core/components/ui/popover"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@core/components/ui/command"
import { Badge } from "@core/components/ui/badge"
import { X, ChevronDown } from "lucide-react"
import { Button } from "@core/components/ui/button"
import { Checkbox } from "@core/components/ui/checkbox"
import { cn } from "@core/lib/utils"

// Constants
const MAX_VISIBLE_BADGES = 3
const DEFAULT_PLACEHOLDER = "Select options..."

// CustomFormFieldProps removed as InputMultiSelect no longer uses control/name directly


export interface InputMultiSelectProps {
  field: ControllerRenderProps<FieldValues, string>
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  className?: string
  maxVisibleBadges?: number
  showSelectAll?: boolean
  inModal?: boolean // Flag to indicate if used inside a modal/dialog
  wrap?: boolean
}

/**
 * Normalizes field value to array of strings
 * Handles both string and object values for backward compatibility
 */
const normalizeValues = (value: unknown): string[] => {
  if (!value) return []

  const rawValues = Array.isArray(value) ? value : [value]

  return rawValues.map(v => {
    if (typeof v === 'object' && v !== null) {
      return String((v as { value?: string; id?: string }).value || (v as { value?: string; id?: string }).id || JSON.stringify(v))
    }
    return String(v)
  })
}

/**
 * Creates a lookup map for O(1) option retrieval
 */
const createOptionMap = (options: { value: string; label: string }[]): Map<string, { value: string; label: string }> => {
  const map = new Map()
  options.forEach(option => {
    map.set(option.value, option)
  })
  return map
}

/**
 * Filters options based on search query
 */
const filterOptions = (
  options: { value: string; label: string }[],
  searchQuery: string
): { value: string; label: string }[] => {
  if (!searchQuery.trim()) return options

  const query = searchQuery.toLowerCase()
  return options.filter(option =>
    option.label.toLowerCase().includes(query) ||
    option.value.toLowerCase().includes(query)
  )
}

export const InputMultiSelect: React.FC<InputMultiSelectProps> = ({
  field,
  options,
  placeholder = DEFAULT_PLACEHOLDER,
  disabled,
  readOnly,
  className,
  maxVisibleBadges = MAX_VISIBLE_BADGES,
  showSelectAll = false,
  inModal = false,
  wrap = false,
}) => {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [popoverWidth, setPopoverWidth] = React.useState<number | undefined>(undefined)
  const [detectedModalContext, setDetectedModalContext] = React.useState(false)

  // Auto-detect modal context if not explicitly provided
  React.useEffect(() => {
    if (inModal) {
      setDetectedModalContext(true)
      return undefined
    }
    // Check if trigger is inside a dialog/modal after mount or when open changes
    const checkModalContext = () => {
      if (triggerRef.current) {
        const dialog = triggerRef.current.closest('[role="dialog"]')
        setDetectedModalContext(!!dialog)
      }
    }
    checkModalContext()
    // Re-check when popover opens
    if (open) {
      // Use setTimeout to ensure DOM is ready
      const timer = setTimeout(checkModalContext, 0)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [inModal, open])

  const isInModalContext = inModal || detectedModalContext

  // Memoized normalized values
  const values = useMemo(() => normalizeValues(field.value), [field.value])

  // Memoized option lookup map for O(1) access
  const optionMap = useMemo(() => createOptionMap(options), [options])

  // Memoized filtered options
  const filteredOptions = useMemo(
    () => filterOptions(options, search),
    [options, search]
  )

  // Memoized computed values
  const selectedCount = useMemo(() => values.length, [values.length])
  const hasSelectedItems = selectedCount > 0
  const allOptionsSelected = useMemo(
    () => values.length === options.length && options.length > 0,
    [values.length, options.length]
  )
  const hasSearchQuery = useMemo(() => search.trim() !== "", [search])
  const hasFilteredResults = useMemo(() => filteredOptions.length > 0, [filteredOptions.length])

  // Adjusted visible badges logic based on wrap prop
  const visibleBadges = useMemo(() => {
    if (wrap) return values;
    return values.slice(0, maxVisibleBadges);
  }, [values, maxVisibleBadges, wrap])

  const remainingCount = useMemo(() => {
    if (wrap) return 0;
    return Math.max(0, selectedCount - maxVisibleBadges);
  }, [selectedCount, maxVisibleBadges, wrap])

  // Sync popover width with trigger
  useEffect(() => {
    if (open && triggerRef.current) {
      setPopoverWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  // Track selecting state for modal context
  const [isSelecting, setIsSelecting] = React.useState(false)

  // Memoized handlers
  const handleSelect = useCallback((value: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    // Mark that we're selecting in modal context
    if (isInModalContext) {
      setIsSelecting(true)
    }

    // Prevent event propagation in modal context
    if (e && isInModalContext) {
      e.stopPropagation()
      e.preventDefault()
    }

    const newValues = values.includes(value)
      ? values.filter(v => v !== value)
      : [...values, value]

    field.onChange(newValues)
    // Don't clear search in modal to keep dropdown open
    if (!isInModalContext) {
      setSearch("")
    }

    // Reset selecting flag after a short delay
    if (isInModalContext) {
      setTimeout(() => setIsSelecting(false), 100)
    }
  }, [values, field, isInModalContext])

  const handleRemove = useCallback((e: React.MouseEvent, value: string) => {
    e.stopPropagation()
    const newValues = values.filter(v => v !== value)
    field.onChange(newValues)
  }, [values, field])

  const handleSelectAll = useCallback(() => {
    const allValues = options.map(opt => opt.value)
    field.onChange(allValues)
    if (!isInModalContext) {
       setSearch("")
    }
  }, [options, field, isInModalContext])

  const handleClearAll = useCallback(() => {
    field.onChange([])
    if (!isInModalContext) {
       setSearch("")
    }
  }, [field, isInModalContext])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, value: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleRemove(e as unknown as React.MouseEvent, value)
    }
  }, [handleRemove])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
  }, [])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    // In modal context, prevent auto-closing when selecting items
    // But allow closing when clicking outside or pressing escape
    if (!newOpen && isInModalContext && isSelecting) {
      // User just selected an item, keep popover open
      setIsSelecting(false)
      return // Prevent closing
    }
    setOpen(newOpen)
    if (!newOpen) {
      setSearch("")
      setIsSelecting(false)
    }
  }, [isInModalContext, isSelecting])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={`Multi-select: ${selectedCount} selected`}
          disabled={disabled || readOnly}
          className={cn(
            "group justify-between px-3 py-2 w-full bg-white",
            wrap ? "h-auto min-h-10" : "h-10",
            "border border-input hover:bg-white hover:border-primary/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            "transition-all duration-200",
            !hasSelectedItems && "text-muted-foreground",
            open && "border-primary ring-2 ring-primary/20",
            disabled && "cursor-not-allowed opacity-50 hover:border-input",
            className
          )}
        >
          <div className={cn(
            "flex flex-1 gap-1.5 items-center max-w-full",
            wrap ? "flex-wrap" : "overflow-x-auto scrollbar-hide"
          )}>
            {!hasSelectedItems ? (
              <span className="text-sm text-muted-foreground transition-colors whitespace-nowrap">{placeholder}</span>
            ) : (
              <>
                {visibleBadges.map((value) => {
                  const option = optionMap.get(value)
                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="gap-1.5 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-white transition-all duration-200 shrink-0 animate-in fade-in-from-left-2 max-w-[200px] flex items-center"
                    >
                      <span className="max-w-[200px] truncate whitespace-nowrap overflow-hidden text-ellipsis" title={option?.label || value}>
                        {option?.label || value}
                      </span>
                      {!readOnly && (
                        <span
                          role="button"
                          tabIndex={0}
                          className="h-4 w-4 p-0.5 hover:bg-destructive/20 rounded-full transition-all duration-150 cursor-pointer inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 hover:scale-110 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(e, value);
                          }}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            handleKeyDown(e, value);
                          }}
                          aria-label={`Remove ${option?.label || value}`}
                        >
                          <X className="h-3 w-3 text-primary hover:text-destructive transition-colors" />
                        </span>
                      )}
                    </Badge>
                  )
                })}
                {remainingCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 shrink-0"
                    title={`${remainingCount} more selected`}
                  >
                    +{remainingCount}
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            {hasSelectedItems && (
              <Badge
                variant="outline"
                className="h-5 px-2 text-xs font-semibold bg-white text-primary border-primary/30"
                aria-label={`${selectedCount} items selected`}
              >
                {selectedCount}
              </Badge>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                open && "transform rotate-180 text-primary"
              )}
              aria-hidden="true"
            />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "p-0 w-full bg-white shadow-lg border border-border/50",
          isInModalContext && "z-[9999] pointer-events-auto"
        )}
        align="start"
        style={{
          width: popoverWidth || 'var(--radix-popover-trigger-width)',
          zIndex: isInModalContext ? 9999 : undefined
        }}
        onEscapeKeyDown={(e) => {
          // In modal context, prevent escape from closing dialog
          if (isInModalContext) {
            e.preventDefault()
            setOpen(false)
          }
        }}
      >
          <Command
            className="rounded-lg border-0 bg-white"
            shouldFilter={false}
            onKeyDown={(e) => {
              // Prevent escape key from closing dialog in modal context
              if (e.key === 'Escape' && isInModalContext) {
                e.stopPropagation()
                setOpen(false)
              }
            }}
            onSelect={(value) => {
              // In modal context, prevent Command from closing popover
              if (isInModalContext && value) {
                // Don't let Command handle the selection - we handle it via onClick
                return
              }
            }}
          >
            <div
              onMouseDown={(e) => {
                // Ensure focus isn't stolen and event doesn't bubble
                e.stopPropagation()
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <CommandInput
                placeholder="Tìm kiếm..."
                value={search}
                onValueChange={handleSearchChange}
                aria-label="Search options"
                autoFocus
                autoComplete="off"
                className="bg-white"
              />
            </div>
          {showSelectAll && options.length > 0 && (
            <div
              className="flex items-center justify-between px-3 py-2.5 border-b bg-slate-50/50"
              onMouseDown={(e) => {
                if (isInModalContext) {
                  e.stopPropagation()
                }
              }}
            >
              <div
                className="flex items-center gap-2 cursor-pointer hover:opacity-70 select-none transition-opacity"
                onClick={(e) => {
                    e.preventDefault();
                    if (allOptionsSelected) {
                        handleClearAll();
                    } else {
                        handleSelectAll();
                    }
                }}
              >
                  <Checkbox
                     checked={allOptionsSelected}
                     className="h-4 w-4 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
                  />
                  <span className="text-sm font-medium text-foreground">Chọn tất cả</span>
              </div>

              {hasSelectedItems && (
                 <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClearAll();
                    }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors font-medium"
                 >
                    <X className="h-3.5 w-3.5" />
                    Xóa tất cả
                 </button>
              )}
            </div>
          )}
          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden bg-white">
             {hasFilteredResults ? (
               <CommandGroup>
                 {filteredOptions.map((option) => {
                   const isSelected = values.includes(option.value)
                   return (
                     <CommandItem
                       key={option.value}
                       value={option.value}
                       onSelect={(currentValue) => {
                         // Handle selection
                         handleSelect(currentValue)
                       }}
                       className={cn(
                         "cursor-pointer py-2.5 px-3 group transition-colors bg-white",
                         "hover:bg-white",
                         "data-[selected=true]:bg-primary data-[selected=true]:text-white"
                       )}
                       onMouseDown={(e) => {
                         // Prevent event bubbling in modal context
                         if (isInModalContext) {
                           e.stopPropagation()
                         }
                       }}
                       onClick={(e) => {
                         // Prevent dialog from closing
                         e.stopPropagation()
                       }}
                     >
                       <div className="flex items-center w-full gap-2 pointer-events-none">
                         <Checkbox
                           checked={isSelected}
                           className="h-4 w-4 border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white group-data-[selected=true]:border-white group-data-[selected=true]:data-[state=checked]:bg-white group-data-[selected=true]:data-[state=checked]:text-primary"
                         />
                         <span className={cn("flex-1 text-sm", isSelected && "font-semibold")}>
                           {option.label}
                         </span>
                       </div>
                     </CommandItem>
                   )
                 })}
               </CommandGroup>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground" role="status">
                {hasSearchQuery
                  ? "Không tìm thấy kết quả"
                  : allOptionsSelected
                    ? "Đã chọn tất cả"
                    : "Không có tùy chọn"}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}



export default InputMultiSelect

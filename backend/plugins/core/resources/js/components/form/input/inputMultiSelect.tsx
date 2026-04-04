import React, { useMemo, useCallback, useRef, useEffect, useState } from "react"
import { FieldValues, ControllerRenderProps } from "react-hook-form"
import { Popover, PopoverContent, PopoverTrigger } from "@core/components/ui/popover"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@core/components/ui/command"
import { Badge } from "@core/components/ui/badge"
import { X, ChevronDown } from "lucide-react"
import { Button } from "@core/components/ui/button"
import { Checkbox } from "@core/components/ui/checkbox"
import { cn } from "@core/lib/utils"

export interface InputMultiSelectProps {
  field: ControllerRenderProps<FieldValues, string>
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  className?: string
  showSelectAll?: boolean
  inModal?: boolean
}

const normalizeValues = (value: unknown): string[] => {
  if (!value) return []
  const raw = Array.isArray(value) ? value : [value]
  return raw.map(v =>
    typeof v === 'object' && v !== null
      ? String((v as { value?: string; id?: string }).value ?? (v as { value?: string; id?: string }).id ?? JSON.stringify(v))
      : String(v)
  )
}

export const InputMultiSelect: React.FC<InputMultiSelectProps> = ({
  field,
  options,
  placeholder = "Select options...",
  disabled,
  readOnly,
  className,
  showSelectAll = true,
  inModal = false,
}) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [isSelecting, setIsSelecting] = useState(false)
  const [inModalContext, setInModalContext] = useState(inModal)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (inModal) { setInModalContext(true); return }
    if (triggerRef.current) {
      setInModalContext(!!triggerRef.current.closest('[role="dialog"]'))
    }
  }, [inModal, open])

  const values = useMemo(() => normalizeValues(field.value), [field.value])
  const optionMap = useMemo(() => new Map(options.map(o => [o.value, o])), [options])
  const filteredOptions = useMemo(() => {
    const q = search.toLowerCase().trim()
    return q ? options.filter(o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)) : options
  }, [options, search])

  const allSelected = values.length === options.length && options.length > 0

  const toggle = useCallback((value: string) => {
    if (inModalContext) setIsSelecting(true)
    const next = values.includes(value) ? values.filter(v => v !== value) : [...values, value]
    field.onChange(next)
    if (inModalContext) setTimeout(() => setIsSelecting(false), 100)
    else setSearch("")
  }, [values, field, inModalContext])

  const remove = useCallback((e: React.MouseEvent, value: string) => {
    e.stopPropagation()
    field.onChange(values.filter(v => v !== value))
  }, [values, field])

  const handleOpenChange = useCallback((next: boolean) => {
    if (!next && inModalContext && isSelecting) { setIsSelecting(false); return }
    setOpen(next)
    if (!next) { setSearch(""); setIsSelecting(false) }
  }, [inModalContext, isSelecting])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || readOnly}
          className={cn(
            "group justify-between px-3 py-2 w-full h-auto min-h-10 bg-white",
            "border border-input hover:bg-white hover:border-primary/50 transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            !values.length && "text-muted-foreground",
            open && "border-primary ring-2 ring-primary/20",
            disabled && "cursor-not-allowed opacity-50 hover:border-input",
            className
          )}
        >
          <div className="flex flex-1 flex-wrap gap-1.5 items-center max-w-full">
            {!values.length ? (
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            ) : values.map(val => {
              const opt = optionMap.get(val)
              return (
                <Badge
                  key={val}
                  variant="secondary"
                  className="gap-1.5 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-white transition-all shrink-0 flex items-center"
                >
                  <span className="max-w-[200px] truncate" title={opt?.label ?? val}>
                    {opt?.label ?? val}
                  </span>
                  {!readOnly && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="h-4 w-4 p-0.5 hover:bg-destructive/20 rounded-full cursor-pointer inline-flex items-center justify-center shrink-0"
                      onClick={(e) => remove(e, val)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); remove(e as unknown as React.MouseEvent, val) } }}
                    >
                      <X className="h-3 w-3 text-primary hover:text-destructive" />
                    </span>
                  )}
                </Badge>
              )
            })}
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            {values.length > 0 && (
              <Badge variant="outline" className="h-5 px-2 text-xs font-semibold bg-white text-primary border-primary/30">
                {values.length}
              </Badge>
            )}
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180 text-primary")} />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("p-0 bg-white shadow-lg border border-border/50", inModalContext && "z-9999 pointer-events-auto")}
        align="start"
        style={{ width: 'var(--radix-popover-trigger-width)', zIndex: inModalContext ? 9999 : undefined }}
        onEscapeKeyDown={(e) => { if (inModalContext) { e.preventDefault(); setOpen(false) } }}
      >
        <Command shouldFilter={false} className="rounded-lg border-0 bg-white"
          onKeyDown={(e) => { if (e.key === 'Escape' && inModalContext) { e.stopPropagation(); setOpen(false) } }}
        >
          <div onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <CommandInput
              placeholder="Tìm kiếm..."
              value={search}
              onValueChange={setSearch}
              autoFocus
              autoComplete="off"
              className="bg-white"
            />
          </div>

          {showSelectAll && options.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2.5 border-b bg-slate-50/50"
              onMouseDown={(e) => { if (inModalContext) e.stopPropagation() }}
            >
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 select-none"
                onClick={(e) => { e.preventDefault(); field.onChange(allSelected ? [] : options.map(o => o.value)) }}
              >
                <Checkbox checked={allSelected} className="h-4 w-4 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white" />
                <span className="text-sm font-medium">Chọn tất cả</span>
              </div>
              {values.length > 0 && (
                <button type="button" onClick={() => field.onChange([])}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> Xóa tất cả
                </button>
              )}
            </div>
          )}

          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden bg-white">
            {filteredOptions.length > 0 ? (
              <CommandGroup>
                {filteredOptions.map((option) => {
                  const isSelected = values.includes(option.value)
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={toggle}
                      className="cursor-pointer py-2.5 px-3 group transition-colors bg-white hover:bg-white data-[selected=true]:bg-primary data-[selected=true]:text-white"
                      onMouseDown={(e) => { if (inModalContext) e.stopPropagation() }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center w-full gap-2 pointer-events-none">
                        <Checkbox
                          checked={isSelected}
                          className="h-4 w-4 border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white group-data-[selected=true]:border-white group-data-[selected=true]:data-[state=checked]:bg-white group-data-[selected=true]:data-[state=checked]:text-primary"
                        />
                        <span className={cn("flex-1 text-sm", isSelected && "font-semibold")}>{option.label}</span>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {search.trim() ? "Không tìm thấy kết quả" : allSelected ? "Đã chọn tất cả" : "Không có tùy chọn"}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default InputMultiSelect

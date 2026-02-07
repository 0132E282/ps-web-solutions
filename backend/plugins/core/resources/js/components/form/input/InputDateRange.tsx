import React from "react";
import { type ControllerRenderProps, type FieldValues } from "react-hook-form";
import { Button } from "@core/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@core/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@core/components/ui/select";
import { Input } from "@core/components/ui/input";
import { cn } from "@core/lib/utils";
import { CalendarGrid } from "@core/components/ui/calendar-grid";

export interface InputDateRangeProps {
  field?: ControllerRenderProps<FieldValues, string>;
  name?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  description?: string;
  showPresets?: boolean;
  value?: DateRangeValue;
  onChange?: (value: DateRangeValue) => void;
}

interface DateRangeValue {
  from: string;
  to: string;
}

interface PresetDate {
  label: string;
  from: string;
  to: string;
}

const getPresetDates = (): PresetDate[] => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const last7Days = new Date(today);
  last7Days.setDate(today.getDate() - 7);

  const last30Days = new Date(today);
  last30Days.setDate(today.getDate() - 30);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  return [
    {
      label: 'Today',
      from: formatDate(today),
      to: formatDate(today),
    },
    {
      label: 'Yesterday',
      from: formatDate(yesterday),
      to: formatDate(yesterday),
    },
    {
      label: 'Last 7 days',
      from: formatDate(last7Days),
      to: formatDate(today),
    },
    {
      label: 'Last 30 days',
      from: formatDate(last30Days),
      to: formatDate(today),
    },
    {
      label: 'This month',
      from: formatDate(thisMonth),
      to: formatDate(today),
    },
    {
      label: 'Last month',
      from: formatDate(lastMonth),
      to: formatDate(lastMonthEnd),
    },
  ];
};



const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const InputDateRange: React.FC<InputDateRangeProps> = ({
  field,
  name = 'date-range',
  placeholder = "Chọn khoảng thời gian...",
  className,
  disabled = false,
  readOnly = false,
  value: propValue,
  onChange: propOnChange,
}) => {
  const [open, setOpen] = React.useState(false);
  const [customFrom, setCustomFrom] = React.useState('');
  const [customTo, setCustomTo] = React.useState('');
  const [activePreset, setActivePreset] = React.useState<string | null>(null);
  const [calendarDate, setCalendarDate] = React.useState<Date>(() => new Date());

  // Parse field value - prioritize prop value over field value
  const rawValue = propValue || (field?.value as Partial<DateRangeValue> | undefined);
  const value: DateRangeValue = {
      from: rawValue?.from || '',
      to: rawValue?.to || ''
  };
  const fromValue = value.from;
  const toValue = value.to;

  const handleChange = (newValue: DateRangeValue) => {
    if (propOnChange) {
        propOnChange(newValue);
    }
    field?.onChange(newValue);
  };

  const presets = React.useMemo(() => getPresetDates(), []);

  React.useEffect(() => {
    setCustomFrom(fromValue);
    setCustomTo(toValue);
    const matchedPreset = presets.find(
      (p) => p.from === fromValue && p.to === toValue
    );
    setActivePreset(matchedPreset?.label || null);
    if (fromValue) {
      setCalendarDate(new Date(fromValue));
    }
  }, [fromValue, toValue, presets]);

  const handleDateInputChange = (fieldType: 'from' | 'to', value: string) => {
    const dateStr = value || '';
    const newValue = fieldType === 'from'
      ? { from: dateStr, to: customTo }
      : { from: customFrom, to: dateStr };

    if (fieldType === 'from') {
      setCustomFrom(dateStr);
    } else {
      setCustomTo(dateStr);
    }
    handleChange(newValue);
  };

  const handleDateSelect = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const dateStr = dateObj.toISOString().split('T')[0];
    if (!dateStr) return;

    if (!customFrom || (customFrom && customTo)) {
      // Start new selection
      setCustomFrom(dateStr);
      setCustomTo('');
      handleChange({ from: dateStr, to: '' });
    } else {
      // Complete selection
      const finalFrom = dateStr < customFrom ? dateStr : customFrom;
      const finalTo = dateStr < customFrom ? customFrom : dateStr;
      setCustomFrom(finalFrom);
      setCustomTo(finalTo);
      handleChange({ from: finalFrom, to: finalTo });
    }
  };

  const updateCalendarDate = (updater: (date: Date) => void) => {
    const newDate = new Date(calendarDate);
    updater(newDate);
    setCalendarDate(newDate);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    updateCalendarDate((date) => {
      date.setMonth(date.getMonth() + (direction === 'prev' ? -1 : 1));
    });
  };

  const handleMonthSelect = (month: string) => {
    updateCalendarDate((date) => {
      date.setMonth(parseInt(month) - 1);
    });
  };

  const handleYearSelect = (year: string) => {
    updateCalendarDate((date) => {
      date.setFullYear(parseInt(year));
    });
  };

  const handlePresetSelect = (preset: PresetDate) => {
    setCustomFrom(preset.from);
    setCustomTo(preset.to);
    setActivePreset(preset.label);
    handleChange({ from: preset.from, to: preset.to });
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomFrom('');
    setCustomTo('');
    setActivePreset(null);
    handleChange({ from: '', to: '' });
  };

  const hasValue = (fromValue && fromValue.trim() !== '') || (toValue && toValue.trim() !== '');
  const displayText = hasValue
    ? `${fromValue} - ${toValue}`
    : placeholder || `Chọn ${name.toLowerCase()}...`;

  // Generate years list (current year - 10 to current year + 10)
  const todayYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => todayYear - 10 + i);
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  const currentMonth = (calendarDate.getMonth() + 1).toString().padStart(2, '0');
  const currentYear = calendarDate.getFullYear();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || readOnly}
          className={cn(
            "w-full justify-between font-normal",
            !hasValue && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {displayText}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {hasValue && !disabled && !readOnly && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[700px] p-0" align="start">
        <div className="flex">
          {/* Left Panel - Presets */}
          <div className="w-48 p-3 border-r">
            <div className="space-y-1">
              <h4 className="text-sm font-medium mb-2">Chọn khoảng thời gian</h4>
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant={activePreset === preset.label ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  onClick={() => handlePresetSelect(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Right Panel - Calendar */}
          <div className="flex-1 p-3">
            <div className="space-y-3">
              {/* Custom Date Inputs */}
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customFrom || ''}
                  placeholder="From date"
                  onChange={(e) => handleDateInputChange('from', e.target.value)}
                  className="h-8 flex-1 text-xs"
                />
                <span className="text-muted-foreground text-xs">-</span>
                <Input
                  type="date"
                  value={customTo || ''}
                  placeholder="To date"
                  onChange={(e) => handleDateInputChange('to', e.target.value)}
                  className="h-8 flex-1 text-xs"
                />
              </div>

              {/* Calendar Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMonthChange('prev')}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <div className="flex items-center gap-1.5">
                  <Select
                    value={currentMonth}
                    onValueChange={handleMonthSelect}
                  >
                    <SelectTrigger className="h-7 w-[60px] text-xs px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={currentYear.toString()}
                    onValueChange={handleYearSelect}
                  >
                    <SelectTrigger className="h-7 w-[70px] text-xs px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMonthChange('next')}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <CalendarGrid
                currentDate={calendarDate}
                selectedFrom={customFrom}
                selectedTo={customTo}
                onDateSelect={handleDateSelect}
              />

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => {
                    setCustomFrom('');
                    setCustomTo('');
                    handleChange({ from: '', to: '' });
                    setOpen(false);
                  }}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setOpen(false)}
                  disabled={!customFrom || !customTo}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default InputDateRange;

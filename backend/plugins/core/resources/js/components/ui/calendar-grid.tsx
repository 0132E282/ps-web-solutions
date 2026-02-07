import React from "react";
import { Button } from "@core/components/ui/button";
import { cn } from "@core/lib/utils";

interface CalendarGridProps {
  currentDate: Date;
  selectedFrom?: string;
  selectedTo?: string;
  onDateSelect: (date: string) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  selectedFrom,
  selectedTo,
  onDateSelect,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and last day of month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = firstDay.getDay();

  // Generate calendar days
  const days = [];

  // Add empty cells for days before the first day of month
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(day);
  }

  // Week days header
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const isDateSelected = (day: number | null) => {
    if (!day) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr === selectedFrom || dateStr === selectedTo;
  };

  const isDateInRange = (day: number | null) => {
    if (!day || !selectedFrom || !selectedTo) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr > selectedFrom && dateStr < selectedTo;
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  return (
    <div className="space-y-2">
      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="h-6 flex items-center justify-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 text-xs font-normal",
              !day && "invisible",
              isDateSelected(day) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              isDateInRange(day) && "bg-primary/10 text-primary",
              isToday(day) && !isDateSelected(day) && (
                (selectedFrom || selectedTo)
                  ? "border border-primary text-primary"
                  : "bg-accent text-accent-foreground"
              )
            )}
            onClick={() => day && onDateSelect(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
            disabled={!day}
          >
            {day}
          </Button>
        ))}
      </div>
    </div>
  );
};

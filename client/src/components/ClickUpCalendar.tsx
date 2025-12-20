import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
  subDays,
  addDays,
  startOfYear,
  endOfYear,
} from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DateRange {
  from: Date;
  to: Date;
}

interface ClickUpCalendarProps {
  mode?: "single" | "range";
  selected?: Date | DateRange | null;
  onSelect?: (date: Date | DateRange | null) => void;
  className?: string;
  showQuickSelectors?: boolean;
  numberOfMonths?: number;
}

interface QuickSelector {
  label: string;
  getValue: () => DateRange;
}

const quickSelectors: QuickSelector[] = [
  {
    label: "Hari Ini",
    getValue: () => {
      const today = new Date();
      return { from: today, to: today };
    },
  },
  {
    label: "Kemarin",
    getValue: () => {
      const yesterday = subDays(new Date(), 1);
      return { from: yesterday, to: yesterday };
    },
  },
  {
    label: "7 Hari Terakhir",
    getValue: () => {
      const today = new Date();
      return { from: subDays(today, 6), to: today };
    },
  },
  {
    label: "30 Hari Terakhir",
    getValue: () => {
      const today = new Date();
      return { from: subDays(today, 29), to: today };
    },
  },
  {
    label: "Bulan Ini",
    getValue: () => {
      const today = new Date();
      return { from: startOfMonth(today), to: endOfMonth(today) };
    },
  },
  {
    label: "Tahun Ini",
    getValue: () => {
      const today = new Date();
      return { from: startOfYear(today), to: endOfYear(today) };
    },
  },
];

const DAYS_OF_WEEK = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function ClickUpCalendar({
  mode = "range",
  selected,
  onSelect,
  className,
  showQuickSelectors = true,
  numberOfMonths = 2,
}: ClickUpCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    if (mode === "range" && selected && (selected as DateRange).from) {
      return (selected as DateRange).from;
    }
    if (mode === "single" && selected instanceof Date) {
      return selected;
    }
    return new Date();
  });

  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);
  const [selectingRange, setSelectingRange] = React.useState<"from" | "to">("from");
  
  // Internal pending range for selection (only applied when complete)
  const [pendingRange, setPendingRange] = React.useState<DateRange | null>(() => {
    if (mode === "range" && selected && typeof selected === "object" && "from" in selected) {
      return selected as DateRange;
    }
    return null;
  });

  // Sync pendingRange when selected prop changes externally
  React.useEffect(() => {
    if (mode === "range" && selected && typeof selected === "object" && "from" in selected) {
      const range = selected as DateRange;
      setPendingRange(range);
      // Reset selecting state when external selection changes
      if (range.from && range.to && !isSameDay(range.from, range.to)) {
        setSelectingRange("from");
      }
    }
  }, [selected, mode]);

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const getMonthDays = (monthDate: Date) => {
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  // Use pendingRange for visual display
  const displayRange = pendingRange;

  const isDateSelected = (date: Date) => {
    if (mode === "single" && selected instanceof Date) {
      return isSameDay(date, selected);
    }
    if (mode === "range" && displayRange) {
      return isSameDay(date, displayRange.from) || (displayRange.to && isSameDay(date, displayRange.to));
    }
    return false;
  };

  const isDateInRange = (date: Date) => {
    if (mode !== "range") return false;
    
    let fromDate: Date | null = null;
    let toDate: Date | null = null;
    
    if (displayRange) {
      fromDate = displayRange.from;
      toDate = displayRange.to;
    }
    
    // If we're selecting the "to" date and hovering, show preview
    if (selectingRange === "to" && fromDate && hoverDate) {
      const start = fromDate < hoverDate ? fromDate : hoverDate;
      const end = fromDate < hoverDate ? hoverDate : fromDate;
      return date > start && date < end;
    }
    
    if (!fromDate || !toDate) return false;
    
    const start = fromDate < toDate ? fromDate : toDate;
    const end = fromDate < toDate ? toDate : fromDate;
    
    return date > start && date < end;
  };

  const isRangeStart = (date: Date) => {
    if (mode !== "range" || !displayRange) return false;
    return isSameDay(date, displayRange.from);
  };

  const isRangeEnd = (date: Date) => {
    if (mode !== "range" || !displayRange) return false;
    return displayRange.to && isSameDay(date, displayRange.to);
  };

  const handleDateClick = (date: Date) => {
    if (mode === "single") {
      onSelect?.(date);
      return;
    }

    // Range mode - update pending range internally
    if (selectingRange === "from") {
      // Start new range selection
      setPendingRange({ from: date, to: date });
      setSelectingRange("to");
    } else {
      // Complete range selection
      if (pendingRange) {
        let newRange: DateRange;
        if (date < pendingRange.from) {
          // If selected date is before the start, swap
          newRange = { from: date, to: pendingRange.from };
        } else {
          newRange = { from: pendingRange.from, to: date };
        }
        setPendingRange(newRange);
        // Only call onSelect when range is complete (start !== end)
        if (!isSameDay(newRange.from, newRange.to)) {
          onSelect?.(newRange);
        }
      }
      setSelectingRange("from");
    }
  };

  const handleQuickSelect = (selector: QuickSelector) => {
    const range = selector.getValue();
    setPendingRange(range);
    onSelect?.(range);
    setCurrentMonth(range.from);
    setSelectingRange("from");
  };

  const renderMonth = (monthOffset: number) => {
    const monthDate = addMonths(currentMonth, monthOffset);
    const days = getMonthDays(monthDate);

    return (
      <div className="flex-1 min-w-[280px]">
        {/* Month Header */}
        <div className="flex items-center justify-center mb-4">
          {monthOffset === 0 && (
            <button
              onClick={goToPreviousMonth}
              className="absolute left-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <span className="text-base font-semibold text-gray-900 dark:text-white">
            {format(monthDate, "MMMM yyyy", { locale: id })}
          </span>
          {monthOffset === numberOfMonths - 1 && (
            <button
              onClick={goToNextMonth}
              className="absolute right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, monthDate);
            const isSelectedDay = isDateSelected(day);
            const isInRange = isDateInRange(day);
            const isTodayDate = isToday(day);
            const isStart = isRangeStart(day);
            const isEnd = isRangeEnd(day);

            return (
              <div
                key={idx}
                className={cn(
                  "relative h-10 flex items-center justify-center",
                  isInRange && "bg-blue-100 dark:bg-blue-900/30"
                )}
              >
                {/* Range background connectors */}
                {isStart && displayRange?.to && !isSameDay(day, displayRange.to) && (
                  <div className="absolute inset-y-0 left-1/2 right-0 bg-blue-100 dark:bg-blue-900/30" />
                )}
                {isEnd && displayRange?.from && !isSameDay(day, displayRange.from) && (
                  <div className="absolute inset-y-0 left-0 right-1/2 bg-blue-100 dark:bg-blue-900/30" />
                )}
                
                <button
                  onClick={() => handleDateClick(day)}
                  onMouseEnter={() => selectingRange === "to" && setHoverDate(day)}
                  onMouseLeave={() => setHoverDate(null)}
                  disabled={!isCurrentMonth}
                  className={cn(
                    "relative z-10 w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-150",
                    // Base states
                    !isCurrentMonth && "text-gray-300 dark:text-gray-600 cursor-not-allowed",
                    isCurrentMonth && "text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer",
                    // Today indicator
                    isTodayDate && !isSelectedDay && "ring-2 ring-blue-500 ring-inset",
                    // Selected day
                    isSelectedDay && "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
                    // Range start/end rounded
                    isStart && "rounded-full",
                    isEnd && "rounded-full"
                  )}
                >
                  {format(day, "d")}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Check if range is complete (start and end are different)
  const isRangeComplete = pendingRange && !isSameDay(pendingRange.from, pendingRange.to);
  const isSelectingEnd = selectingRange === "to";

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden",
        className
      )}
    >
      <div className="flex">
        {/* Quick Selectors Sidebar */}
        {showQuickSelectors && (
          <div className="w-44 border-r border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
            <div className="space-y-1">
              {quickSelectors.map((selector, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickSelect(selector)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-150",
                    "text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-700 dark:hover:text-blue-300",
                    // Active state (optional, could compare with current selection)
                  )}
                >
                  {selector.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Calendar Content */}
        <div className="flex-1 p-4">
          <div className="relative flex gap-8 justify-center">
            {Array.from({ length: numberOfMonths }, (_, i) => (
              <React.Fragment key={i}>
                {renderMonth(i)}
                {i < numberOfMonths - 1 && (
                  <div className="w-px bg-gray-200 dark:bg-gray-700 self-stretch my-4" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Footer with selected range display and helper text */}
          {mode === "range" && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {pendingRange ? (
                  <>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {format(pendingRange.from, "d MMM yyyy", { locale: id })}
                    </span>
                    <span className="mx-2">→</span>
                    <span className={cn(
                      "font-medium",
                      isSelectingEnd ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"
                    )}>
                      {isSelectingEnd && isSameDay(pendingRange.from, pendingRange.to)
                        ? "Pilih tanggal akhir"
                        : format(pendingRange.to, "d MMM yyyy", { locale: id })
                      }
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">Pilih tanggal mulai</span>
                )}
              </div>
              {/* Helper text for current state */}
              {isSelectingEnd && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Klik tanggal akhir untuk menerapkan filter
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Single Date Compact Version (for simple date picker like ClickUp)
interface ClickUpDatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export function ClickUpDatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  className,
}: ClickUpDatePickerProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => value || new Date());
  const [selectedQuick, setSelectedQuick] = React.useState<string | null>(null);

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const getMonthDays = () => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const handleDateClick = (date: Date) => {
    onChange?.(date);
    setSelectedQuick(null);
  };

  const handleQuickSelect = (label: string, date: Date) => {
    onChange?.(date);
    setSelectedQuick(label);
    setCurrentMonth(date);
  };

  const quickDates = [
    { label: "Hari Ini", date: new Date() },
    { label: "Kemarin", date: subDays(new Date(), 1) },
    { label: "Besok", date: addDays(new Date(), 1) },
  ];

  const days = getMonthDays();

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden w-[320px]",
        className
      )}
    >
      {/* Quick Date Selectors */}
      <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {quickDates.map((item) => (
          <button
            key={item.label}
            onClick={() => handleQuickSelect(item.label, item.date)}
            className={cn(
              "flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150",
              selectedQuick === item.label || (value && isSameDay(value, item.date))
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {format(currentMonth, "MMMM yyyy", { locale: id })}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelectedDay = value && isSameDay(day, value);
            const isTodayDate = isToday(day);

            return (
              <button
                key={idx}
                onClick={() => handleDateClick(day)}
                disabled={!isCurrentMonth}
                className={cn(
                  "h-9 w-9 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-150",
                  !isCurrentMonth && "text-gray-300 dark:text-gray-600 cursor-not-allowed",
                  isCurrentMonth && "text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer",
                  isTodayDate && !isSelectedDay && "ring-2 ring-blue-500 ring-inset",
                  isSelectedDay && "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ClickUpCalendar;

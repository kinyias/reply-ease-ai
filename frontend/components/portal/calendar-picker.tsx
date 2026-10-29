"use client";

import { useI18n } from "@/context/i18n-context";

import { useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface CalendarPickerProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
}

const VI_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const EN_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarPicker({
  selectedDate,
  onSelectDate,
  minDate = new Date(),
}: CalendarPickerProps) {
  const { t, locale } = useI18n();
  const daysOfWeek = locale === "vi" ? VI_DAYS : EN_DAYS;
  const [viewDate, setViewDate] = useState<Date>(() => new Date(selectedDate));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Normalized minDate (00:00:00)
  const normalizedMinDate = useMemo(() => {
    const d = new Date(minDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [minDate]);

  // Today (00:00:00)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Compute calendar grid days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday is index 0 in DAYS_OF_WEEK
    // JS getDay(): Sunday = 0, Monday = 1 ... Saturday = 6
    const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = lastDayOfMonth.getDate();

    const days: (Date | null)[] = [];

    // Prefix empty slots
    for (let i = 0; i < startingDayIndex; i++) {
      days.push(null);
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [year, month]);

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
      {/* Month & Year Navigation Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
          {viewDate.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label={t("portal.prevMonth", "Previous Month")}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label={t("portal.nextMonth", "Next Month")}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {daysOfWeek.map((d: string) => (
          <span
            key={d}
            className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 py-1"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="h-9 sm:h-10" />;
          }

          const isPast = date < normalizedMinDate;
          const isSelected = isSameDay(date, selectedDate);
          const isCurrentToday = isSameDay(date, today);

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={isPast}
              onClick={() => onSelectDate(date)}
              className={`h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-medium transition-all relative flex items-center justify-center ${
                isSelected
                  ? "bg-orange-600 text-white font-semibold shadow-xs"
                  : isPast
                  ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                  : "text-zinc-800 dark:text-zinc-200 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-orange-600 dark:hover:text-orange-400"
              }`}
            >
              <span>{date.getDate()}</span>
              {isCurrentToday && !isSelected && (
                <span className="absolute bottom-1.5 size-1 rounded-full bg-orange-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

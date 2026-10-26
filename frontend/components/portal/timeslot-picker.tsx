"use client";

import { CheckIcon, ClockIcon, LockIcon } from "lucide-react";
import { DEFAULT_TIMESLOTS } from "@/hooks/portal/use-portal-appointment";

interface TimeslotPickerProps {
  slots?: string[];
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
  isSlotBooked: (slot: string) => boolean;
  selectedDate?: Date;
}

export function TimeslotPicker({
  slots = DEFAULT_TIMESLOTS,
  selectedSlot,
  onSelectSlot,
  isSlotBooked,
  selectedDate,
}: TimeslotPickerProps) {
  const formattedDate = selectedDate
    ? selectedDate.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClockIcon className="size-4 text-orange-600 dark:text-orange-400" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
            Khung giờ hẹn
          </h3>
        </div>
        {formattedDate && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
            {formattedDate}
          </span>
        )}
      </div>

      {/* Timeslots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
        {slots.map((slot) => {
          const booked = isSlotBooked(slot);
          const isSelected = selectedSlot.toUpperCase() === slot.toUpperCase();

          return (
            <button
              key={slot}
              type="button"
              disabled={booked}
              onClick={() => onSelectSlot(slot)}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all flex items-center justify-between ${
                isSelected
                  ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                  : booked
                  ? "bg-zinc-100/70 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-600 border-zinc-200/50 dark:border-zinc-800/50 cursor-not-allowed line-through"
                  : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 hover:text-orange-600 dark:hover:text-orange-400"
              }`}
            >
              <span>{slot}</span>
              {isSelected ? (
                <CheckIcon className="size-3.5 stroke-[2.5]" />
              ) : booked ? (
                <span className="text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-600 flex items-center gap-0.5 no-underline">
                  <LockIcon className="size-2.5" />
                  Kín
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-orange-600" />
          <span>Đang chọn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" />
          <span>Còn trống</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span>Đã có người đặt</span>
        </div>
      </div>
    </div>
  );
}

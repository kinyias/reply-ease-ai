"use client";

import { ArrowLeftIcon, CalendarDaysIcon, CheckCircleIcon, MailIcon } from "lucide-react";
import { CalendarPicker } from "./calendar-picker";
import { TimeslotPicker } from "./timeslot-picker";

interface StepScheduleProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
  isSlotBooked: (slot: string) => boolean;
  email: string;
  onChangeEmail: (email: string) => void;
  onSubmit: () => void;
  onBack?: () => void;
  isSubmitting: boolean;
  domainName: string;
}

export function StepSchedule({
  selectedDate,
  onSelectDate,
  selectedSlot,
  onSelectSlot,
  isSlotBooked,
  email,
  onChangeEmail,
  onSubmit,
  onBack,
  isSubmitting,
  domainName,
}: StepScheduleProps) {
  const formattedDate = selectedDate.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const canSubmit = selectedDate && selectedSlot && email.includes("@");

  return (
    <div className="space-y-6">
      {/* Date & Time selection layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Calendar Picker */}
        <div>
          <CalendarPicker
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            minDate={new Date()}
          />
        </div>

        {/* Right: Timeslot Picker */}
        <div>
          <TimeslotPicker
            selectedSlot={selectedSlot}
            onSelectSlot={onSelectSlot}
            isSlotBooked={isSlotBooked}
            selectedDate={selectedDate}
          />
        </div>
      </div>

      {/* Customer Email & Confirmation summary card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base flex items-center gap-2">
          <MailIcon className="size-4 text-orange-600" />
          <span>Thông tin người nhận xác nhận lịch hẹn</span>
        </h4>

        <div className="max-w-md space-y-1.5">
          <label
            htmlFor="customer-email"
            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            Địa chỉ Email của bạn
          </label>
          <input
            id="customer-email"
            type="email"
            value={email}
            onChange={(e) => onChangeEmail(e.target.value)}
            placeholder="tenban@example.com"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-zinc-400"
          />
          <p className="text-[11px] text-zinc-400">
            Thông tin chi tiết và thư mời tham gia buổi hẹn sẽ được gửi đến email này.
          </p>
        </div>

        {/* Live booking summary preview */}
        {selectedSlot && (
          <div className="p-3.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 flex items-start gap-3">
            <CalendarDaysIcon className="size-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Lịch hẹn dự kiến với {domainName}:
              </span>
              <p className="text-orange-800 dark:text-orange-300 font-medium mt-0.5 capitalize">
                {selectedSlot} — {formattedDate}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors"
            >
              <ArrowLeftIcon className="size-4" />
              <span>Quay lại câu hỏi</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            disabled={!canSubmit || isSubmitting}
            onClick={onSubmit}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircleIcon className="size-4" />
            <span>
              {isSubmitting ? "Đang xử lý..." : "Xác nhận đặt lịch hẹn"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

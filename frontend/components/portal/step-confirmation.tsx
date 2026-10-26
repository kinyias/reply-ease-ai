"use client";

import { useState } from "react";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  CopyIcon,
  ExternalLinkIcon,
  MailIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { BookingResponse } from "@/types/portal";

interface StepConfirmationProps {
  booking: BookingResponse;
  domainName: string;
}

export function StepConfirmation({ booking, domainName }: StepConfirmationProps) {
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(booking.date).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Generate Google Calendar Link
  const googleCalendarUrl = (() => {
    try {
      const d = new Date(booking.date);
      // parse hour from slot e.g. "09:00 AM", "01:30 PM"
      const slotParts = booking.slot.split(" ");
      const [h, m] = slotParts[0].split(":").map(Number);
      const isPM = slotParts[1]?.toUpperCase() === "PM";
      const startHour = isPM && h < 12 ? h + 12 : !isPM && h === 12 ? 0 : h;

      d.setHours(startHour, m || 0, 0, 0);
      const endD = new Date(d.getTime() + 45 * 60 * 1000); // 45 min session

      const formatIso = (date: Date) =>
        date.toISOString().replace(/-|:|\.\d\d\d/g, "");

      const title = encodeURIComponent(`Cuộc hẹn tư vấn cùng ${domainName}`);
      const details = encodeURIComponent(
        `Lịch hẹn được xác nhận qua Reply Ease AI.\nMã đặt lịch: ${booking.id}\nEmail: ${booking.email}`
      );
      const dates = `${formatIso(d)}/${formatIso(endD)}`;

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
    } catch {
      return "#";
    }
  })();

  const handleCopy = () => {
    const text = `Lịch hẹn với ${domainName}\nKhung giờ: ${booking.slot}\nNgày: ${formattedDate}\nMã cuộc hẹn: ${booking.id}\nEmail: ${booking.email}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Đã sao chép thông tin lịch hẹn!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Success Hero Header */}
      <div className="text-center space-y-2">
        <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
          <CheckCircle2Icon className="size-8 stroke-[2.2]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Đặt lịch hẹn thành công!
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
          Cảm ơn bạn. Chúng tôi đã gửi thông tin xác nhận và lời nhắc lịch hẹn đến email của bạn.
        </p>
      </div>

      {/* Modern Ticket / Receipt Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Top Branding Bar */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4" />
            <span className="font-semibold text-sm tracking-wide">
              THƯ XÁC NHẬN CUỘC HẸN
            </span>
          </div>
          <span className="text-[11px] font-mono tracking-wider opacity-90">
            {booking.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* Content details */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                Đơn vị tư vấn
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {domainName}
              </p>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                Email người nhận
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                {booking.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-start gap-2.5">
              <CalendarDaysIcon className="size-4 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                  Ngày hẹn
                </span>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 capitalize">
                  {formattedDate}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ClockIcon className="size-4 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                  Khung giờ
                </span>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {booking.slot}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
            <MailIcon className="size-4 text-zinc-400 mt-0.5 shrink-0" />
            <span>
              Chúng tôi sẽ liên hệ hoặc gửi link phòng họp trực tuyến trước buổi hẹn 15 phút.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-zinc-50/70 dark:bg-zinc-800/30 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-2.5">
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors"
          >
            <CalendarDaysIcon className="size-4" />
            <span>Thêm vào Google Calendar</span>
            <ExternalLinkIcon className="size-3.5 opacity-80" />
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 text-zinc-700 dark:text-zinc-300 font-medium text-xs sm:text-sm transition-colors"
          >
            <CopyIcon className="size-4" />
            <span>{copied ? "Đã sao chép!" : "Sao chép thông tin"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

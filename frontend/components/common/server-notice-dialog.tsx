"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/context/i18n-context";
import { Server, Clock, Sparkles } from "lucide-react";

const STORAGE_KEY = "replyease_server_notice_date";

export function ServerNoticeDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { locale } = useI18n();
  const isVi = locale === "vi";

  useEffect(() => {
    setMounted(true);
    try {
      const now = new Date();
      // Định dạng YYYY-MM-DD theo múi giờ địa phương của người dùng
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const lastShownDate = localStorage.getItem(STORAGE_KEY);

      // Nếu hôm nay chưa hiển thị thì mở thông báo
      if (lastShownDate !== today) {
        setIsOpen(true);
      }
    } catch (e) {
      console.warn("Could not access localStorage for server notice:", e);
    }
  }, []);

  const handleClose = () => {
    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      localStorage.setItem(STORAGE_KEY, today);
    } catch (e) {
      console.warn("Could not save server notice date to localStorage:", e);
    }
    setIsOpen(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 shrink-0">
              <Server className="size-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 mb-1">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                {isVi ? "Môi trường Thử nghiệm" : "Demo & Testing Environment"}
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isVi ? "Thông báo máy chủ thử nghiệm" : "Testing Server Notice"}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2.5">
            {isVi
              ? "Hệ thống ReplyEase AI hiện đang được triển khai trên máy chủ phục vụ mục đích kiểm thử và trải nghiệm tính năng (Testing/Demo)."
              : "ReplyEase AI is currently hosted on a testing server intended for evaluation and feature demonstration."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <Clock className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {isVi
                  ? "Tài nguyên máy chủ có giới hạn nên thời gian phản hồi (API/AI) đôi lúc có thể bị chậm trễ hoặc cần thời gian khởi động (cold start). Rất mong quý khách và các bạn thông cảm!"
                  : "Due to limited demo server resources, API and AI response times may occasionally experience delays or cold starts. We appreciate your patience and understanding!"}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="size-4 text-[#c2410c] shrink-0 mt-0.5" />
              <span>
                {isVi
                  ? "Mọi tính năng tư vấn bán hàng và mô phỏng thanh toán VietQR đều đang hoạt động ở chế độ thử nghiệm an toàn."
                  : "All conversational sales and VietQR payment flows are running in a secure sandbox test mode."}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 pt-2 border-t-0">
          <Button
            type="button"
            onClick={handleClose}
            className="w-full h-10 bg-[#c2410c] hover:bg-[#9a3412] text-white font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            {isVi ? "Tôi đã hiểu" : "I Understand"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

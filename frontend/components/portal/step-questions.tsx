"use client";

import { ArrowRightIcon, HelpCircleIcon, MessageSquareIcon } from "lucide-react";
import { CustomerResponseItem } from "@/types/portal";

interface StepQuestionsProps {
  questions: CustomerResponseItem[];
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  onSkip?: () => void;
}

export function StepQuestions({
  questions,
  answers,
  onAnswerChange,
  onSubmit,
  isSubmitting,
  onSkip,
}: StepQuestionsProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="size-8 rounded-lg bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <MessageSquareIcon className="size-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Thông tin trước buổi hẹn
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Vui lòng cung cấp thêm thông tin để chúng tôi có thể chuẩn bị buổi tư vấn chu đáo nhất.
            </p>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {questions.map((q, index) => {
            const currentVal = answers[q.id] ?? "";
            return (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2"
              >
                <label
                  htmlFor={`question-${q.id}`}
                  className="block text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  <span className="text-orange-600 font-semibold mr-1.5">
                    Câu {index + 1}:
                  </span>
                  {q.question}
                </label>
                <textarea
                  id={`question-${q.id}`}
                  rows={2}
                  value={currentVal}
                  onChange={(e) => onAnswerChange(q.id, e.target.value)}
                  placeholder="Nhập câu trả lời của bạn..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-zinc-400"
                />
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          {onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium transition-colors"
            >
              Bỏ qua bước này &rarr;
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors disabled:opacity-50"
          >
            <span>{isSubmitting ? "Đang lưu..." : "Tiếp tục chọn lịch"}</span>
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

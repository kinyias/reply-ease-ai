"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Filter,
  GraduationCap,
  HelpCircle,
  ListFilter,
  Plus,
  Trash2,
} from "lucide-react";

import {
  FAQ_PRESETS,
  FILTER_QUESTION_PRESETS,
  useFilterQuestions,
  useHelpDesk,
} from "@/hooks/settings/use-training";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BotTrainingProps {
  domainId: string;
}

export function BotTraining({ domainId }: BotTrainingProps) {
  const [activeTab, setActiveTab] = useState<"helpdesk" | "filter">("helpdesk");

  // HelpDesk FAQ hook
  const {
    faqs,
    form: faqForm,
    isLoading: isLoadingFaqs,
    isAdding: isAddingFaq,
    onAddFaq,
    deleteFaq,
    applyPreset: applyFaqPreset,
  } = useHelpDesk(domainId);

  // Filter Questions hook
  const {
    questions,
    form: qForm,
    isLoading: isLoadingQuestions,
    isAdding: isAddingQuestion,
    onAddQuestion,
    deleteQuestion,
    applyPreset: applyQPreset,
  } = useFilterQuestions(domainId);

  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  return (
    <div className="w-full space-y-6">
      {/* Section Header */}
      <div className="border-b border-border pb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Bot Training & Knowledge Base
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <GraduationCap className="size-3" />
            AI Training
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Huấn luyện trí tuệ nhân tạo với bộ câu hỏi giải đáp thắc mắc (HelpDesk
          FAQ) và bộ câu hỏi sàng lọc khách hàng tiềm năng (Filter Questions).
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("helpdesk")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
            activeTab === "helpdesk"
              ? "border-brand-accent text-brand-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <HelpCircle className="size-4" />
          <span>HelpDesk FAQ ({faqs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("filter")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
            activeTab === "filter"
              ? "border-brand-accent text-brand-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListFilter className="size-4" />
          <span>Filter Questions / Lead Qualifier ({questions.length})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: HELPDESK FAQ                                            */}
      {/* ============================================================== */}
      {activeTab === "helpdesk" && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          {/* Add FAQ Form */}
          <form
            onSubmit={onAddFaq}
            className="bg-card border border-border rounded-xl p-6 shadow-2xs space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Plus className="size-4 text-brand-accent" />
                <span>Thêm câu hỏi & câu trả lời FAQ mới</span>
              </h3>
              <span className="text-xs text-muted-foreground">
                Hiển thị trong cửa sổ chat cho khách tra cứu
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="faq_question" className="text-xs font-semibold">
                  Câu hỏi thường gặp:
                </Label>
                <Input
                  id="faq_question"
                  placeholder="Ví dụ: Chính sách hoàn tiền và đổi trả hàng thế nào?"
                  {...faqForm.register("question")}
                />
                {faqForm.formState.errors.question && (
                  <p className="text-xs text-destructive">
                    {faqForm.formState.errors.question.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="faq_answer" className="text-xs font-semibold">
                  Câu trả lời chính thức:
                </Label>
                <Textarea
                  id="faq_answer"
                  rows={3}
                  placeholder="Ví dụ: Hỗ trợ 1-đổi-1 trong vòng 7 ngày cho mọi sản phẩm phát sinh lỗi từ nhà sản xuất..."
                  {...faqForm.register("answer")}
                />
                {faqForm.formState.errors.answer && (
                  <p className="text-xs text-destructive">
                    {faqForm.formState.errors.answer.message}
                  </p>
                )}
              </div>
            </div>

            {/* Presets suggestions */}
            <div className="space-y-2 pt-1 border-t border-border/60">
              <span className="text-xs text-muted-foreground">
                Hoặc chọn mẫu câu hỏi thông dụng:
              </span>
              <div className="flex flex-wrap gap-2">
                {FAQ_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyFaqPreset(preset)}
                    className="text-xs bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-md border border-border/80 transition-colors text-left"
                  >
                    {preset.q}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isAddingFaq}
                className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-1.5 text-xs h-9 px-5 font-semibold"
              >
                <Plus className="size-3.5" />
                <span>{isAddingFaq ? "Đang thêm..." : "Thêm câu hỏi FAQ"}</span>
              </Button>
            </div>
          </form>

          {/* List of Existing FAQs */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Danh sách câu hỏi FAQ đã tạo ({faqs.length})
            </h3>

            {isLoadingFaqs ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                Đang nạp danh sách câu hỏi FAQ...
              </div>
            ) : faqs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl space-y-1">
                <HelpCircle className="size-6 text-muted-foreground/50 mx-auto" />
                <p className="font-medium text-foreground">Chưa có câu hỏi FAQ nào</p>
                <p>Thêm các câu hỏi thường gặp ở form trên để bot tự động giải đáp cho khách.</p>
              </div>
            ) : (
              <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
                {faqs.map((faq) => {
                  const isExpanded = expandedFaqId === faq.id;
                  return (
                    <div key={faq.id} className="p-4 transition-colors hover:bg-muted/30">
                      <div className="flex items-start justify-between gap-4">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedFaqId(isExpanded ? null : faq.id)
                          }
                          className="flex-1 text-left flex items-start gap-2.5 group"
                        >
                          <ChevronDown
                            className={`size-4 text-muted-foreground shrink-0 mt-0.5 transition-transform ${
                              isExpanded ? "rotate-180 text-foreground" : ""
                            }`}
                          />
                          <div>
                            <span className="text-sm font-semibold text-foreground group-hover:text-brand-accent transition-colors">
                              {faq.question}
                            </span>
                            {!isExpanded && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {faq.answer}
                              </p>
                            )}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteFaq(faq.id)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                          title="Xóa câu hỏi FAQ này"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pl-6.5 text-xs text-muted-foreground leading-relaxed bg-muted/40 p-3 rounded-lg whitespace-pre-wrap">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: FILTER QUESTIONS (LEAD QUALIFIER)                       */}
      {/* ============================================================== */}
      {activeTab === "filter" && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          {/* Explanation Banner */}
          <div className="bg-brand-elevated border border-brand-border rounded-xl p-4 flex items-start gap-3">
            <Filter className="size-5 text-brand-accent shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-semibold text-foreground">
                Cơ chế lọc và phân loại khách hàng tiềm năng (Lead Qualifier)
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Khi khách hàng gửi tin nhắn vào widget, AI Sales Bot sẽ tự động
                hỏi <strong>tuần tự theo thứ tự</strong> các câu hỏi dưới đây để
                thu thập thông tin và gắn thẻ khách hàng tiềm năng tự động vào
                hệ thống CRM.
              </p>
            </div>
          </div>

          {/* Quick Add Filter Question Form */}
          <form
            onSubmit={onAddQuestion}
            className="bg-card border border-border rounded-xl p-6 shadow-2xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Plus className="size-4 text-brand-accent" />
                <span>Thêm câu hỏi lọc lead mới</span>
              </h3>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter_q" className="text-xs font-semibold">
                Nội dung câu hỏi:
              </Label>
              <div className="flex gap-2">
                <Input
                  id="filter_q"
                  placeholder="Ví dụ: Bạn đang tìm kiếm giải pháp cho cá nhân hay doanh nghiệp?"
                  className="flex-1"
                  {...qForm.register("question")}
                />
                <Button
                  type="submit"
                  disabled={isAddingQuestion}
                  className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-1.5 text-xs h-9 px-5 font-semibold shrink-0"
                >
                  <Plus className="size-3.5" />
                  <span>
                    {isAddingQuestion ? "Đang thêm..." : "Thêm câu hỏi"}
                  </span>
                </Button>
              </div>
              {qForm.formState.errors.question && (
                <p className="text-xs text-destructive">
                  {qForm.formState.errors.question.message}
                </p>
              )}
            </div>

            {/* Presets suggestions */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <span className="text-xs text-muted-foreground">
                Gợi ý câu hỏi sàng lọc nhanh:
              </span>
              <div className="flex flex-wrap gap-2">
                {FILTER_QUESTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyQPreset(preset)}
                    className="text-xs bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-md border border-border/80 transition-colors text-left"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* List of Sequence Filter Questions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Trình tự các câu hỏi bot sẽ hỏi ({questions.length})
            </h3>

            {isLoadingQuestions ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                Đang nạp danh sách câu hỏi lọc...
              </div>
            ) : questions.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl space-y-1">
                <ListFilter className="size-6 text-muted-foreground/50 mx-auto" />
                <p className="font-medium text-foreground">
                  Chưa có câu hỏi lọc nào
                </p>
                <p>
                  Thêm câu hỏi ở form trên để bot tự động phân loại nhu cầu của
                  khách.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {questions.map((q, index) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-2xs gap-4 transition-all hover:border-brand-accent/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-7 rounded-full bg-brand-accent/10 text-brand-accent font-bold text-xs flex items-center justify-center shrink-0">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {q.question}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteQuestion(q.id)}
                      className="text-muted-foreground hover:text-destructive p-1.5 rounded-md transition-colors"
                      title="Xóa câu hỏi lọc này"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BotTraining;

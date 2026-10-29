"use client";

import * as React from "react";
import { ChevronDownIcon, HelpCircleIcon, MessageCircleQuestionIcon, SearchIcon } from "lucide-react";
import { ChatbotFAQItem } from "@/types/chatbot";
import { useI18n } from "@/context/i18n-context";

interface FAQTabProps {
  faqs: ChatbotFAQItem[];
  themeColor?: string | null;
  onAskFAQ: (question: string) => void;
}

export function FAQTab({ faqs, themeColor, onAskFAQ }: FAQTabProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [openIds, setOpenIds] = React.useState<Record<string, boolean>>({});

  const toggleFAQ = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = React.useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const q = searchQuery.toLowerCase();
    return faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
    );
  }, [faqs, searchQuery]);

  const accentColor = themeColor || "#ff7a00";

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Search Header */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 shrink-0">
        <div className="relative flex items-center">
          <SearchIcon className="size-3.5 absolute left-3 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("chatbot.faqSearchPlaceholder", "Search frequently asked questions...")}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-orange-500/50"
          />
        </div>
      </div>

      {/* FAQs List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
        {filteredFaqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-2">
            <HelpCircleIcon className="size-8 text-zinc-300 dark:text-zinc-600" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {searchQuery ? t("chatbot.faqEmptySearch", "No matching questions found.") : t("chatbot.faqEmptyAll", "No FAQ items configured yet.")}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {t("chatbot.faqEmptyHint")}
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = Boolean(openIds[faq.id]);

            return (
              <div
                key={faq.id}
                className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-3.5 py-3 flex items-center justify-between gap-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDownIcon
                    className={`size-4 text-zinc-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-3.5 pb-3 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-2">
                    <p className="whitespace-pre-wrap">{faq.answer}</p>

                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onAskFAQ(faq.question)}
                        style={{ color: accentColor }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium hover:underline cursor-pointer"
                      >
                        <MessageCircleQuestionIcon className="size-3" />
                        {t("chatbot.faqAskMore", "Ask AI more about this")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import { CheckIcon } from "lucide-react";

export interface StepItem {
  id: string;
  label: string;
  description?: string;
}

interface PortalProgressProps {
  steps: StepItem[];
  currentStepId: string;
}

export function PortalProgress({ steps, currentStepId }: PortalProgressProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <div className="w-full py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <nav aria-label="Tiến trình">
          <ol className="flex items-center justify-between w-full">
            {steps.map((step, idx) => {
              const isPassed = idx < currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <li
                  key={step.id}
                  className={`flex items-center ${
                    idx !== steps.length - 1 ? "w-full" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`size-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                        isPassed
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                          ? "bg-orange-600 text-white ring-4 ring-orange-100 dark:ring-orange-950/50"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {isPassed ? (
                        <CheckIcon className="size-3.5 stroke-[2.5]" />
                      ) : (
                        idx + 1
                      )}
                    </span>
                    <div className="hidden sm:flex flex-col">
                      <span
                        className={`text-xs font-medium ${
                          isCurrent
                            ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                            : isPassed
                            ? "text-zinc-700 dark:text-zinc-300"
                            : "text-zinc-400 dark:text-zinc-500"
                        }`}
                      >
                        {step.label}
                      </span>
                      {step.description && (
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          {step.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {idx !== steps.length - 1 && (
                    <div
                      className={`flex-1 mx-3 sm:mx-4 h-0.5 transition-colors duration-200 ${
                        isPassed
                          ? "bg-emerald-600 dark:bg-emerald-500"
                          : "bg-zinc-200 dark:bg-zinc-800"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { Loader2Icon } from "lucide-react";
import { usePortalAppointment } from "@/hooks/portal/use-portal-appointment";
import { PortalHeader } from "./portal-header";
import { PortalProgress, StepItem } from "./portal-progress";
import { StepConfirmation } from "./step-confirmation";
import { StepQuestions } from "./step-questions";
import { StepSchedule } from "./step-schedule";

interface AppointmentWizardProps {
  domainId: string;
  customerId: string;
}

export function AppointmentWizard({ domainId, customerId }: AppointmentWizardProps) {
  const {
    data,
    isLoading,
    isSubmitting,
    currentStep,
    setCurrentStep,
    answers,
    handleAnswerChange,
    handleSaveAnswers,
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    email,
    setEmail,
    isSlotBooked,
    handleConfirmBooking,
    bookingConfirmation,
  } = usePortalAppointment(domainId, customerId);

  const wizardSteps: StepItem[] = useMemo(() => {
    const list: StepItem[] = [];

    if (data && data.questions.length > 0) {
      list.push({
        id: "questions",
        label: "Khảo sát",
        description: "Thông tin sơ bộ",
      });
    }

    list.push(
      {
        id: "schedule",
        label: "Chọn ngày & giờ",
        description: "Khung thời gian phù hợp",
      },
      {
        id: "confirmed",
        label: "Xác nhận",
        description: "Hoàn tất đặt lịch",
      }
    );

    return list;
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Loader2Icon className="size-8 text-orange-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Đang tải thông tin đặt lịch hẹn...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 text-center">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Không tìm thấy trang đặt lịch
        </h2>
        <p className="text-sm text-zinc-500 max-w-sm">
          Đường dẫn không hợp lệ hoặc thông tin khách hàng không tồn tại.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 flex flex-col">
      {/* Header */}
      <PortalHeader
        domainName={data.domain_name}
        domainIcon={data.domain_icon}
        subtitle="Cổng thông tin đặt lịch hẹn trực tuyến"
        badgeText="Bảo mật SSL 256-bit"
      />

      {/* Progress Stepper */}
      <PortalProgress steps={wizardSteps} currentStepId={currentStep} />

      {/* Main Wizard Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {currentStep === "questions" && (
          <StepQuestions
            questions={data.questions}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onSubmit={handleSaveAnswers}
            isSubmitting={isSubmitting}
            onSkip={() => setCurrentStep("schedule")}
          />
        )}

        {currentStep === "schedule" && (
          <StepSchedule
            domainName={data.domain_name}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            isSlotBooked={isSlotBooked}
            email={email}
            onChangeEmail={setEmail}
            onSubmit={handleConfirmBooking}
            onBack={
              data.questions.length > 0 ? () => setCurrentStep("questions") : undefined
            }
            isSubmitting={isSubmitting}
          />
        )}

        {currentStep === "confirmed" && bookingConfirmation && (
          <StepConfirmation
            booking={bookingConfirmation}
            domainName={data.domain_name}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-zinc-200/80 dark:border-zinc-800 text-center text-xs text-zinc-400">
        Được cung cấp bởi Reply Ease AI &bull; Hệ thống trợ lý AI & Đặt lịch tự động
      </footer>
    </div>
  );
}

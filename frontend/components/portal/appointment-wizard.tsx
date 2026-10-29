"use client";

import { useI18n } from "@/context/i18n-context";

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
  const { t } = useI18n();
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
        label: t("portal.stepSurveyLabel", "Survey"),
        description: t("portal.stepSurveyDesc", "Initial details"),
      });
    }

    list.push(
      {
        id: "schedule",
        label: t("portal.stepScheduleLabel", "Date & Time"),
        description: t("portal.stepScheduleDesc", "Suitable time slot"),
      },
      {
        id: "confirmed",
        label: t("portal.stepConfirmLabel", "Confirm"),
        description: t("portal.stepConfirmDesc", "Complete booking"),
      }
    );

    return list;
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Loader2Icon className="size-8 text-orange-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {t("portal.loadingAppointment", "Loading appointment details...")}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 text-center">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          {t("portal.appointmentNotFound", "Appointment page not found")}
        </h2>
        <p className="text-sm text-zinc-500 max-w-sm">
          {t("portal.invalidLink", "Invalid URL or customer record does not exist.")}
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
        subtitle={t("portal.portalSubtitleBooking", "Online consultation booking portal")}
        badgeText={t("portal.securityBadge", "256-bit SSL Secure")}
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
        {t("portal.poweredBy", "Powered by ReplyEase AI • Autonomous AI Assistant & Booking System")}
      </footer>
    </div>
  );
}

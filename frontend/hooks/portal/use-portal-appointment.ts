"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { portalService } from "@/services/portal-service";
import {
  AnswerInputItem,
  BookingResponse,
  CustomerResponseItem,
  PortalAppointmentData,
} from "@/types/portal";

export type AppointmentWizardStep = "questions" | "schedule" | "confirmed";

export const DEFAULT_TIMESLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "01:30 PM",
  "02:30 PM",
  "03:30 PM",
  "04:30 PM",
  "05:00 PM",
];

export function usePortalAppointment(domainId: string, customerId: string) {
  const [data, setData] = useState<PortalAppointmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<AppointmentWizardStep>("schedule");

  // Wizard State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default to tomorrow
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [bookingConfirmation, setBookingConfirmation] = useState<BookingResponse | null>(null);

  // Load appointment data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const portalData = await portalService.getAppointmentData(domainId, customerId);
        if (!isMounted) return;

        setData(portalData);
        if (portalData.email) {
          setEmail(portalData.email);
        }

        // Initialize answers state from existing questions
        const initialAnswers: Record<string, string> = {};
        let hasUnanswered = false;

        portalData.questions.forEach((q) => {
          if (q.answered) {
            initialAnswers[q.id] = q.answered;
          } else {
            initialAnswers[q.id] = "";
            hasUnanswered = true;
          }
        });
        setAnswers(initialAnswers);

        // If there are questions and some are unanswered, start at questions step
        if (portalData.questions.length > 0 && hasUnanswered) {
          setCurrentStep("questions");
        } else {
          setCurrentStep("schedule");
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } }; message?: string };
        toast.error(
          error.response?.data?.detail || "Không thể tải dữ liệu cổng thông tin đặt lịch."
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (domainId && customerId) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [domainId, customerId]);

  // Check which slots are already booked on selectedDate
  const bookedSlotsForDate = useMemo(() => {
    if (!data?.booked_slots || !selectedDate) return new Set<string>();

    const targetDateStr = selectedDate.toISOString().split("T")[0];
    const booked = new Set<string>();

    data.booked_slots.forEach((item) => {
      const itemDateStr = new Date(item.date).toISOString().split("T")[0];
      if (itemDateStr === targetDateStr) {
        booked.add(item.slot.trim().toUpperCase());
      }
    });

    return booked;
  }, [data?.booked_slots, selectedDate]);

  // Check if slot is available
  const isSlotBooked = (slot: string) => {
    return bookedSlotsForDate.has(slot.trim().toUpperCase());
  };

  // Update a single question answer
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Submit questions answers step
  const handleSaveAnswers = async () => {
    const formattedAnswers: AnswerInputItem[] = Object.entries(answers).map(
      ([id, val]) => ({
        id,
        answered: val.trim(),
      })
    );

    setIsSubmitting(true);
    try {
      if (formattedAnswers.length > 0) {
        await portalService.submitAnswers(customerId, formattedAnswers);
        toast.success("Thông tin khảo sát đã được cập nhật.");
      }
      setCurrentStep("schedule");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(
        error.response?.data?.detail || "Có lỗi khi lưu câu trả lời. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Final booking submission
  const handleConfirmBooking = async () => {
    if (!selectedDate) {
      toast.error("Vui lòng chọn ngày hẹn.");
      return;
    }
    if (!selectedSlot) {
      toast.error("Vui lòng chọn khung giờ hẹn.");
      return;
    }
    if (!email || !email.includes("@")) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ để nhận thông báo xác nhận.");
      return;
    }

    if (isSlotBooked(selectedSlot)) {
      toast.error("Khung giờ này vừa có người đặt. Vui lòng chọn khung giờ khác.");
      return;
    }

    const formattedAnswers: AnswerInputItem[] = Object.entries(answers)
      .filter(([, val]) => val.trim().length > 0)
      .map(([id, val]) => ({
        id,
        answered: val.trim(),
      }));

    setIsSubmitting(true);
    try {
      const result = await portalService.bookAppointment(domainId, customerId, {
        date: selectedDate.toISOString(),
        slot: selectedSlot,
        email: email.trim().toLowerCase(),
        answers: formattedAnswers.length > 0 ? formattedAnswers : undefined,
      });

      setBookingConfirmation(result);
      setCurrentStep("confirmed");
      toast.success("Đặt lịch hẹn thành công!");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(
        error.response?.data?.detail || "Không thể đặt lịch hẹn. Vui lòng kiểm tra lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
}

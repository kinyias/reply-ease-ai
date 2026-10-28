"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import trainingService from "@/services/training-service";
import {
  CreateFilterQuestionInput,
  CreateHelpDeskInput,
} from "@/types/training";
import {
  createFilterQuestionSchema,
  CreateFilterQuestionFormValues,
  createHelpDeskSchema,
  CreateHelpDeskFormValues,
} from "@/schemas/training";

// Presets for FAQ items
export const FAQ_PRESETS = [
  {
    q: "Thời gian xử lý & giao hàng tiêu chuẩn?",
    a: "Đơn hàng nội thành giao trong 24h. Các tỉnh thành khác nhận hàng từ 2-3 ngày làm việc qua đơn vị vận chuyển tiêu chuẩn.",
  },
  {
    q: "Chính sách đổi trả & hoàn tiền sản phẩm?",
    a: "Hỗ trợ đổi mới 1-đổi-1 miễn phí trong vòng 7 ngày cho mọi sản phẩm phát sinh lỗi từ nhà sản xuất hoặc sai sót trong quá trình vận chuyển.",
  },
  {
    q: "Hướng dẫn quét mã thanh toán VietQR?",
    a: "Sau khi bấm mua hàng, hệ thống tự động sinh mã VietQR với đúng số tiền và nội dung đơn. Bạn chỉ cần mở app ngân hàng bất kỳ quét mã là đơn hàng sẽ được kích hoạt tức thì.",
  },
];

// Presets for Filter Questions
export const FILTER_QUESTION_PRESETS = [
  "Bạn đang tìm giải pháp cho cá nhân hay doanh nghiệp?",
  "Nhu cầu hỗ trợ của bạn cần triển khai trong khoảng thời gian nào?",
  "Ngân sách dự kiến của bạn cho dự án này là bao nhiêu?",
  "Số lượng khách hàng hoặc lượt truy cập hàng tháng của bạn?",
];

/**
 * Hook for managing HelpDesk FAQ items
 */
export function useHelpDesk(domainId: string) {
  const queryClient = useQueryClient();

  const {
    data: faqs = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["helpdesk", domainId],
    queryFn: () => trainingService.getHelpDesk(domainId),
    enabled: Boolean(domainId),
  });

  const form = useForm<CreateHelpDeskFormValues>({
    resolver: zodResolver(createHelpDeskSchema),
    defaultValues: {
      question: "",
      answer: "",
    },
  });

  const addMutation = useMutation({
    mutationFn: (values: CreateHelpDeskInput) =>
      trainingService.createHelpDesk(domainId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["helpdesk", domainId] });
      queryClient.invalidateQueries({ queryKey: ["domain", domainId] });
      form.reset();
      toast.success("Đã thêm câu hỏi FAQ thành công");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { detail?: string } };
      };
      toast.error(
        axiosError.response?.data?.detail || "Không thể tạo câu hỏi FAQ"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (faqId: string) =>
      trainingService.deleteHelpDesk(domainId, faqId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["helpdesk", domainId] });
      queryClient.invalidateQueries({ queryKey: ["domain", domainId] });
      toast.success("Đã xóa câu hỏi FAQ");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { detail?: string } };
      };
      toast.error(
        axiosError.response?.data?.detail || "Không thể xóa câu hỏi FAQ"
      );
    },
  });

  const onAddFaq = form.handleSubmit((values) => {
    addMutation.mutate(values);
  });

  const applyPreset = (preset: { q: string; a: string }) => {
    form.setValue("question", preset.q, { shouldDirty: true });
    form.setValue("answer", preset.a, { shouldDirty: true });
  };

  return {
    faqs,
    form,
    isLoading,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
    onAddFaq,
    deleteFaq: (faqId: string) => deleteMutation.mutate(faqId),
    applyPreset,
    refetch,
  };
}

/**
 * Hook for managing lead qualifier filter questions
 */
export function useFilterQuestions(domainId: string) {
  const queryClient = useQueryClient();

  const {
    data: questions = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["filter-questions", domainId],
    queryFn: () => trainingService.getFilterQuestions(domainId),
    enabled: Boolean(domainId),
  });

  const form = useForm<CreateFilterQuestionFormValues>({
    resolver: zodResolver(createFilterQuestionSchema),
    defaultValues: {
      question: "",
    },
  });

  const addMutation = useMutation({
    mutationFn: (values: CreateFilterQuestionInput) =>
      trainingService.createFilterQuestion(domainId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["filter-questions", domainId],
      });
      queryClient.invalidateQueries({ queryKey: ["domain", domainId] });
      form.reset();
      toast.success("Đã thêm câu hỏi lọc lead thành công");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { detail?: string } };
      };
      toast.error(
        axiosError.response?.data?.detail || "Không thể tạo câu hỏi lọc"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) =>
      trainingService.deleteFilterQuestion(domainId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["filter-questions", domainId],
      });
      queryClient.invalidateQueries({ queryKey: ["domain", domainId] });
      toast.success("Đã xóa câu hỏi lọc lead");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { detail?: string } };
      };
      toast.error(
        axiosError.response?.data?.detail || "Không thể xóa câu hỏi lọc"
      );
    },
  });

  const onAddQuestion = form.handleSubmit((values) => {
    addMutation.mutate(values);
  });

  const applyPreset = (q: string) => {
    form.setValue("question", q, { shouldDirty: true });
  };

  return {
    questions,
    form,
    isLoading,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
    onAddQuestion,
    deleteQuestion: (qId: string) => deleteMutation.mutate(qId),
    applyPreset,
    refetch,
  };
}

/**
 * Hook for managing Knowledge Documents (PDF, Excel, TXT)
 */
export function useKnowledgeDocuments(domainId: string) {
  const queryClient = useQueryClient();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const {
    data: documents = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["knowledge-documents", domainId],
    queryFn: () => trainingService.getDocuments(domainId),
    enabled: Boolean(domainId),
  });

  const {
    data: chunks = [],
    isLoading: isLoadingChunks,
  } = useQuery({
    queryKey: ["knowledge-chunks", domainId, selectedDocId],
    queryFn: () =>
      selectedDocId
        ? trainingService.getDocumentChunks(domainId, selectedDocId)
        : Promise.resolve([]),
    enabled: Boolean(domainId && selectedDocId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => trainingService.uploadDocument(domainId, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["knowledge-documents", domainId],
      });
      queryClient.invalidateQueries({ queryKey: ["domain", domainId] });
      toast.success(
        `Đã huấn luyện thành công tệp "${data.file_name}" (${data.num_chunks} đoạn tri thức)`
      );
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { detail?: string } };
      };
      toast.error(
        axiosError.response?.data?.detail ||
          "Không thể tải lên và huấn luyện tài liệu"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) =>
      trainingService.deleteDocument(domainId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["knowledge-documents", domainId],
      });
      queryClient.invalidateQueries({ queryKey: ["domain", domainId] });
      if (selectedDocId) setSelectedDocId(null);
      toast.success("Đã xóa tài liệu và tri thức vector");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { detail?: string } };
      };
      toast.error(axiosError.response?.data?.detail || "Không thể xóa tài liệu");
    },
  });

  const retrainMutation = useMutation({
    mutationFn: (docId: string) =>
      trainingService.retrainDocument(domainId, docId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["knowledge-documents", domainId],
      });
      toast.success(`Đã tái huấn luyện tệp "${data.file_name}" thành công`);
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { detail?: string } };
      };
      toast.error(
        axiosError.response?.data?.detail ||
          "Không thể tái huấn luyện tài liệu"
      );
    },
  });

  return {
    documents,
    isLoading,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRetraining: retrainMutation.isPending,
    selectedDocId,
    setSelectedDocId,
    chunks,
    isLoadingChunks,
    uploadDocument: (file: File) => uploadMutation.mutateAsync(file),
    deleteDocument: (docId: string) => deleteMutation.mutate(docId),
    retrainDocument: (docId: string) => retrainMutation.mutate(docId),
    refetch,
  };
}

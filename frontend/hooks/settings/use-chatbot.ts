"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import domainService from "@/services/domain-service";
import uploadService from "@/services/upload-service";
import { ChatBot, UpdateChatBotInput } from "@/types/domain";
import {
  updateChatBotSchema,
  UpdateChatBotFormValues,
} from "@/schemas/domain";

export const CHATBOT_COLOR_PRESETS = [
  { name: "Safety Amber", hex: "#c2410c" },
  { name: "Corinna Orange", hex: "#ff7a00" },
  { name: "Midnight Slate", hex: "#0f172a" },
  { name: "Emerald Forest", hex: "#059669" },
  { name: "Ocean Teal", hex: "#0d9488" },
  { name: "Rose Crimson", hex: "#e11d48" },
];

export const CHATBOT_AVATAR_PRESETS = [
  {
    name: "Autonomous AI",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
  },
  {
    name: "Customer Support",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80",
  },
  {
    name: "Tech Specialist",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&auto=format&fit=crop&q=80",
  },
  {
    name: "Minimalist Robot",
    url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=128&auto=format&fit=crop&q=80",
  },
];

export const WELCOME_MESSAGE_PRESETS = [
  {
    label: "Sales & Support",
    text: "Xin chào! Mình có thể hỗ trợ bạn kiểm tra tồn kho, tư vấn sản phẩm hoặc chốt đơn ngay bây giờ không?",
  },
  {
    label: "Consultation & Booking",
    text: "Chào bạn! Bạn cần tư vấn dịch vụ hay đặt lịch hẹn trực tiếp với chuyên gia của chúng mình?",
  },
  {
    label: "General Inquiry",
    text: "Hey there! Have a question about our services or need instant help? Text us here.",
  },
];

interface UseChatbotProps {
  domainId: string;
  initialData?: ChatBot | null;
}

export function useChatbot({ domainId, initialData }: UseChatbotProps) {
  const queryClient = useQueryClient();

  // Fetch current chatbot settings
  const {
    data: chatbot,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["chatbot", domainId],
    queryFn: () => domainService.getChatBot(domainId),
    initialData: initialData || undefined,
    enabled: Boolean(domainId),
  });

  const form = useForm<UpdateChatBotFormValues>({
    resolver: zodResolver(updateChatBotSchema),
    defaultValues: {
      welcome_message:
        chatbot?.welcome_message ||
        "Hey there, have a question? Text us here",
      icon: chatbot?.icon || CHATBOT_AVATAR_PRESETS[0].url,
      background: chatbot?.background || "#f25f22",
      text_color: chatbot?.text_color || "#ffffff",
      helpdesk: chatbot?.helpdesk ?? false,
    },
  });

  // Keep live preview synchronized with form values
  const [livePreview, setLivePreview] = useState<UpdateChatBotInput>({
    welcome_message:
      chatbot?.welcome_message ||
      "Hey there, have a question? Text us here",
    icon: chatbot?.icon || CHATBOT_AVATAR_PRESETS[0].url,
    background: chatbot?.background || "#f25f22",
    text_color: chatbot?.text_color || "#ffffff",
    helpdesk: chatbot?.helpdesk ?? false,
  });

  // Watch form changes to update live preview immediately
  useEffect(() => {
    const subscription = form.watch((value) => {
      setLivePreview({
        welcome_message: value.welcome_message ?? "",
        icon: value.icon ?? "",
        background: value.background ?? "#f25f22",
        text_color: value.text_color ?? "#ffffff",
        helpdesk: value.helpdesk ?? false,
      });
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Sync initial query data into form when loaded
  useEffect(() => {
    if (chatbot) {
      form.reset({
        welcome_message:
          chatbot.welcome_message ||
          "Hey there, have a question? Text us here",
        icon: chatbot.icon || CHATBOT_AVATAR_PRESETS[0].url,
        background: chatbot.background || "#f25f22",
        text_color: chatbot.text_color || "#ffffff",
        helpdesk: chatbot.helpdesk ?? false,
      });
    }
  }, [chatbot, form]);

  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);

  // Save mutation
  const mutation = useMutation({
    mutationFn: async (values: UpdateChatBotInput) => {
      let iconUrl = values.icon;
      if (selectedAvatarFile) {
        const uploadRes = await uploadService.uploadImage(selectedAvatarFile);
        iconUrl = uploadRes.url;
      }
      return domainService.updateChatBot(domainId, { ...values, icon: iconUrl });
    },
    onSuccess: (updatedBot) => {
      setSelectedAvatarFile(null);
      queryClient.setQueryData(["chatbot", domainId], updatedBot);
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      queryClient.invalidateQueries({ queryKey: ["domain", domainId] });
      toast.success("Đã lưu cấu hình Chatbot thành công");
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const message =
        axiosError.response?.data?.detail ||
        (error instanceof Error ? error.message : "Failed to update chatbot settings. Please try again.");
      toast.error(message);
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(values);
  });

  const setPresetWelcome = (text: string) => {
    form.setValue("welcome_message", text, { shouldDirty: true });
  };

  const setPresetColor = (hex: string) => {
    form.setValue("background", hex, { shouldDirty: true });
  };

  const setPresetAvatar = (url: string) => {
    setSelectedAvatarFile(null);
    form.setValue("icon", url, { shouldDirty: true });
  };

  const resetForm = () => {
    setSelectedAvatarFile(null);
    if (chatbot) {
      form.reset({
        welcome_message: chatbot.welcome_message || "",
        icon: chatbot.icon || "",
        background: chatbot.background || "#f25f22",
        text_color: chatbot.text_color || "#ffffff",
        helpdesk: chatbot.helpdesk ?? false,
      });
    }
  };

  return {
    form,
    chatbot,
    isLoading,
    isError,
    isSaving: mutation.isPending,
    livePreview,
    onSubmit,
    selectedAvatarFile,
    setSelectedAvatarFile,
    setPresetWelcome,
    setPresetColor,
    setPresetAvatar,
    resetForm,
    refetch,
  };
}

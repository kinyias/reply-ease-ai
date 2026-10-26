"use client";

import * as React from "react";
import { Suspense } from "react";
import { ChatbotWindow } from "@/components/chatbot/chatbot-window";

function ChatbotLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        <span className="text-xs text-zinc-500 font-medium">
          Khởi tạo Chatbot...
        </span>
      </div>
    </div>
  );
}

export default function ChatbotPage() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-transparent">
      <Suspense fallback={<ChatbotLoading />}>
        <ChatbotWindow />
      </Suspense>
    </main>
  );
}

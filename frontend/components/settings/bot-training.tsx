"use client";

import React, { useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Eye,
  File,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  HelpCircle,
  ListFilter,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import {
  FAQ_PRESETS,
  FILTER_QUESTION_PRESETS,
  useFilterQuestions,
  useHelpDesk,
  useKnowledgeDocuments,
} from "@/hooks/settings/use-training";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KnowledgeDocumentItem } from "@/types/training";

interface BotTrainingProps {
  domainId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case "pdf":
      return <FileText className="size-5 text-rose-500" />;
    case "excel":
      return <FileSpreadsheet className="size-5 text-emerald-500" />;
    default:
      return <File className="size-5 text-blue-500" />;
  }
}

export function BotTraining({ domainId }: BotTrainingProps) {
  const [activeTab, setActiveTab] = useState<"helpdesk" | "filter" | "documents">(
    "helpdesk"
  );

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

  // Knowledge Documents hook
  const {
    documents,
    isLoading: isLoadingDocs,
    isUploading,
    isDeleting: isDeletingDoc,
    isRetraining: isRetrainingDoc,
    selectedDocId,
    setSelectedDocId,
    chunks,
    isLoadingChunks,
    uploadDocument,
    deleteDocument,
    retrainDocument,
  } = useKnowledgeDocuments(domainId);

  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Document upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [inspectDoc, setInspectDoc] = useState<KnowledgeDocumentItem | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await uploadDocument(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      // toast already handled in hook
    }
  };

  const handleInspectDoc = (doc: KnowledgeDocumentItem) => {
    setInspectDoc(doc);
    setSelectedDocId(doc.id);
  };

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
          Huấn luyện trí tuệ nhân tạo với bộ câu hỏi FAQ, bộ câu hỏi sàng lọc khách hàng tiềm năng và tài liệu bóc tách vector (PDF, Excel, TXT).
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("helpdesk")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px shrink-0 ${
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
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px shrink-0 ${
            activeTab === "filter"
              ? "border-brand-accent text-brand-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListFilter className="size-4" />
          <span>Filter Questions / Lead Qualifier ({questions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px shrink-0 ${
            activeTab === "documents"
              ? "border-brand-accent text-brand-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="size-4" />
          <span>Tài liệu Tri thức ({documents.length})</span>
          <span className="text-[10px] bg-brand-accent/15 text-brand-accent px-1.5 py-0.5 rounded-full font-bold">
            PDF • Excel • TXT
          </span>
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
      {/* TAB 2: FILTER QUESTIONS                                        */}
      {/* ============================================================== */}
      {activeTab === "filter" && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          {/* Add Filter Question Form */}
          <form
            onSubmit={onAddQuestion}
            className="bg-card border border-border rounded-xl p-6 shadow-2xs space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <ListFilter className="size-4 text-brand-accent" />
                <span>Thêm câu hỏi sàng lọc khách hàng tiềm năng</span>
              </h3>
              <span className="text-xs text-muted-foreground">
                Bot sẽ hỏi tuần tự trong cuộc trò chuyện
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q_question" className="text-xs font-semibold">
                Nội dung câu hỏi sàng lọc:
              </Label>
              <Input
                id="q_question"
                placeholder="Ví dụ: Bạn đang tìm giải pháp cho cá nhân hay doanh nghiệp?"
                {...qForm.register("question")}
              />
              {qForm.formState.errors.question && (
                <p className="text-xs text-destructive">
                  {qForm.formState.errors.question.message}
                </p>
              )}
            </div>

            {/* Presets suggestions */}
            <div className="space-y-2 pt-1 border-t border-border/60">
              <span className="text-xs text-muted-foreground">
                Hoặc chọn mẫu câu hỏi sàng lọc thông dụng:
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

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isAddingQuestion}
                className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-1.5 text-xs h-9 px-5 font-semibold"
              >
                <Plus className="size-3.5" />
                <span>
                  {isAddingQuestion ? "Đang thêm..." : "Thêm câu hỏi sàng lọc"}
                </span>
              </Button>
            </div>
          </form>

          {/* List of Existing Filter Questions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Các câu hỏi sàng lọc đang kích hoạt ({questions.length})
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
                  Thêm câu hỏi ở form trên để bot tự động phân loại nhu cầu của khách.
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

      {/* ============================================================== */}
      {/* TAB 3: KNOWLEDGE DOCUMENTS (PDF, EXCEL, TXT)                   */}
      {/* ============================================================== */}
      {activeTab === "documents" && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          {/* Upload Document Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <UploadCloud className="size-4 text-brand-accent" />
                <span>Huấn luyện AI bằng Tệp Tài liệu & Dữ liệu</span>
              </h3>
              <span className="text-xs text-muted-foreground">
                Tối đa 20MB / tệp • Hỗ trợ tiếng Việt có dấu
              </span>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileSelect(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-brand-accent bg-brand-accent/5 ring-4 ring-brand-accent/10"
                  : "border-border/80 hover:border-brand-accent/60 hover:bg-muted/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.txt,.csv,.md"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              <div className="size-12 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center mb-3">
                <UploadCloud className="size-6" />
              </div>

              <p className="text-sm font-semibold text-foreground">
                Kéo thả tệp vào đây, hoặc{" "}
                <span className="text-brand-accent underline underline-offset-2">
                  bấm để chọn từ máy tính
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Hệ thống tự động trích xuất nội dung, phân đoạn ngữ cảnh (chunking) thông minh và vector hóa vào cơ sở tri thức Pinecone RAG.
              </p>

              {/* Supported Format Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <FileText className="size-3" />
                  PDF (.pdf)
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <FileSpreadsheet className="size-3" />
                  Excel (.xlsx, .xls, .csv)
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <File className="size-3" />
                  Văn bản (.txt, .md)
                </span>
              </div>
            </div>

            {/* Selected File Card & Submit */}
            {selectedFile && (
              <div className="flex items-center justify-between p-4 bg-muted/40 border border-border rounded-xl animate-in fade-in duration-150">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-background border border-border shrink-0">
                    {getFileTypeIcon(selectedFile.name.endsWith(".pdf") ? "pdf" : selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls") || selectedFile.name.endsWith(".csv") ? "excel" : "txt")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatFileSize(selectedFile.size)} • Sẵn sàng nạp và bóc tách
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={isUploading}
                    className="text-xs h-8"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-1.5 text-xs h-8 font-semibold"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Đang xử lý & Vector hóa...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3.5" />
                        <span>Bắt đầu huấn luyện AI</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Guidelines Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1.5">
              <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs">
                <FileText className="size-4" />
                <span>Tệp PDF</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tối ưu cho tài liệu hướng dẫn, quy định bảo hành, đổi trả, giới thiệu dịch vụ. Hệ thống tự động phân tách theo trang và đoạn văn bản.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs">
                <FileSpreadsheet className="size-4" />
                <span>Bảng tính Excel (.xlsx, .xls, .csv)</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tối ưu cho bảng giá sản phẩm, bảng thông số kỹ thuật, tồn kho. Mỗi hàng được gắn kết với tiêu đề cột để AI trả lời giá và mã hàng siêu chính xác.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1.5">
              <div className="flex items-center gap-2 text-blue-500 font-semibold text-xs">
                <File className="size-4" />
                <span>Văn bản thuần (.txt, .md)</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tối ưu cho ghi chú nhanh, kịch bản tư vấn thô, quy trình làm việc. Bóc tách và vector hóa chỉ trong vài giây.
              </p>
            </div>
          </div>

          {/* List of Trained Documents */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Danh sách tài liệu đã huấn luyện ({documents.length})
              </h3>
              {documents.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Tổng: {documents.reduce((acc, d) => acc + d.num_chunks, 0)} đoạn tri thức RAG
                </span>
              )}
            </div>

            {isLoadingDocs ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                Đang nạp danh sách tài liệu...
              </div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl space-y-2">
                <BookOpen className="size-8 text-muted-foreground/40 mx-auto" />
                <p className="font-semibold text-foreground">Chưa có tài liệu nào được huấn luyện</p>
                <p className="max-w-md mx-auto text-xs">
                  Tải lên tệp PDF chính sách, bảng giá Excel hoặc tệp ghi chú TXT ở khung bên trên để bot thông minh hơn khi giải đáp thắc mắc cho khách hàng.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="size-10 rounded-lg flex items-center justify-center shrink-0 border border-border bg-background">
                        {getFileTypeIcon(doc.file_type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {doc.file_name}
                          </p>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                            <CheckCircle2 className="size-3" />
                            Đã huấn luyện
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>•</span>
                          <span className="text-brand-accent font-medium">
                            {doc.num_chunks} đoạn tri thức
                          </span>
                          {doc.created_at && (
                            <>
                              <span>•</span>
                              <span>
                                {new Date(doc.created_at).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleInspectDoc(doc)}
                        className="h-8 text-xs gap-1.5"
                        title="Xem các phân đoạn tri thức bóc tách"
                      >
                        <Eye className="size-3.5" />
                        <span>Xem tri thức</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => retrainDocument(doc.id)}
                        disabled={isRetrainingDoc}
                        className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                        title="Tái vector hóa vào Pinecone"
                      >
                        <RefreshCw
                          className={`size-3.5 ${isRetrainingDoc ? "animate-spin" : ""}`}
                        />
                        <span className="hidden sm:inline">Tái huấn luyện</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDocument(doc.id)}
                        disabled={isDeletingDoc}
                        className="h-8 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40"
                        title="Xóa tài liệu và tri thức vector"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chunks Inspection Modal */}
          {inspectDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-lg flex items-center justify-center border border-border bg-background">
                      {getFileTypeIcon(inspectDoc.file_type)}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {inspectDoc.file_name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Tổng {chunks.length} đoạn tri thức đã được trích xuất và lưu trữ trong cơ sở dữ liệu
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectDoc(null);
                      setSelectedDocId(null);
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                  {isLoadingChunks ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      <Loader2 className="size-6 animate-spin mx-auto mb-2 text-brand-accent" />
                      Đang nạp các đoạn tri thức...
                    </div>
                  ) : chunks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Không tìm thấy đoạn nội dung nào.
                    </div>
                  ) : (
                    chunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className="p-3.5 bg-muted/40 border border-border/80 rounded-xl space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-brand-accent">
                            #{chunk.chunk_index} {chunk.title ? `• ${chunk.title}` : ""}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {chunk.content.length} ký tự
                          </span>
                        </div>
                        <pre className="text-xs text-foreground/90 font-mono whitespace-pre-wrap leading-relaxed bg-background/60 p-2.5 rounded-lg border border-border/50 max-h-48 overflow-y-auto">
                          {chunk.content}
                        </pre>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-3 border-t border-border flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInspectDoc(null);
                      setSelectedDocId(null);
                    }}
                    className="text-xs"
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BotTraining;

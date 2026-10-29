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
import { useI18n } from "@/context/i18n-context";

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
  const { t } = useI18n();
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
          {t("settingsTraining.subtitle", "Train AI with FAQ knowledge base, customer qualification questions, and document vector embeddings (PDF, Excel, TXT).")}
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
          <span>{t("settingsTraining.documentsTab", "Documents")} ({documents.length})</span>
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
                <span>{t("settingsTraining.addFaqBtn", "Add New FAQ")}</span>
              </h3>
              <span className="text-xs text-muted-foreground">
                {t("settingsTraining.faqHelp", "Visible in chatbot widget for visitors")}
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="faq_question" className="text-xs font-semibold">
                  {t("settingsTraining.faqQuestion", "Frequently Asked Question:")}
                </Label>
                <Input
                  id="faq_question"
                  placeholder={t("settingsTraining.faqQuestionPlaceholder", "e.g.: What is your return and refund policy?")}
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
                  {t("settingsTraining.faqAnswer", "Official Answer:")}
                </Label>
                <Textarea
                  id="faq_answer"
                  rows={3}
                  placeholder={t("settingsTraining.faqAnswerPlaceholder", "e.g.: We offer a 1-to-1 replacement within 7 days for any manufacturer defects.")}
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
                {t("settingsTraining.presetTitle", "Or select a common question template:")}
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
                <span>{isAddingFaq ? t("settingsTraining.adding", "Adding...") : t("settingsTraining.addFaqBtn", "Add FAQ Question")}</span>
              </Button>
            </div>
          </form>

          {/* List of Existing FAQs */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t("settingsTraining.faqListTitle", { count: faqs.length }, `Created FAQ Questions (${faqs.length})`)}
            </h3>

            {isLoadingFaqs ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                {t("settingsTraining.faqLoading", "Loading FAQ questions...")}
              </div>
            ) : faqs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl space-y-1">
                <HelpCircle className="size-6 text-muted-foreground/50 mx-auto" />
                <p className="font-medium text-foreground">{t("settingsTraining.emptyFaqTitle", "No FAQ questions yet")}</p>
                <p>{t("settingsTraining.emptyFaqDesc", "Add common question pairs in the form above so bot automatically assists customers.")}</p>
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
                          title={t("settingsTraining.deleteFaqTooltip", "Delete this FAQ question")}
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
                <span>{t("settingsTraining.filterHeader", "Lead Qualifier Questions")}</span>
              </h3>
              <span className="text-xs text-muted-foreground">
                {t("settingsTraining.filterSub", "Bot will ask sequentially during conversation")}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q_question" className="text-xs font-semibold">
                {t("settingsTraining.filterContentLabel", "Qualifier Question Content:")}
              </Label>
              <Input
                id="q_question"
                placeholder={t("settingsTraining.filterPlaceholder", "e.g.: Are you looking for an individual or enterprise solution?")}
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
                {t("settingsTraining.filterPresetTitle", "Or select a common qualifier question:")}
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
                  {isAddingQuestion ? t("settingsTraining.adding", "Adding...") : t("settingsTraining.addFilterBtn", "Add Qualifier Question")}
                </span>
              </Button>
            </div>
          </form>

          {/* List of Existing Filter Questions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t("settingsTraining.filterListTitle", { count: questions.length }, `Active Qualifier Questions (${questions.length})`)}
            </h3>

            {isLoadingQuestions ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                {t("settingsTraining.filterLoading", "Loading qualifier questions...")}
              </div>
            ) : questions.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl space-y-1">
                <ListFilter className="size-6 text-muted-foreground/50 mx-auto" />
                <p className="font-medium text-foreground">
                  {t("settingsTraining.emptyFilterTitle", "No qualifier questions yet")}
                </p>
                <p>
                  {t("settingsTraining.emptyFilterDesc", "Add questions above to automatically qualify prospective customer leads.")}
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
                      title={t("settingsTraining.deleteFilterTooltip", "Delete this qualifier question")}
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
                <span>{t("settingsTraining.docHeader", "Train AI with Documents & Data Files")}</span>
              </h3>
              <span className="text-xs text-muted-foreground">
                {t("settingsTraining.docSub", "Max 20MB / file • Supports PDF, Excel (.xlsx, .csv), and Text (.txt, .md)")}
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
                {t("settingsTraining.dragDropDoc", "Drag and drop file here, or ")}
                <span className="text-brand-accent underline underline-offset-2">
                  {t("settingsTraining.browseFile", "click to browse from computer")}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                {t("settingsTraining.autoExtractNotice", "System automatically extracts content, performs intelligent semantic chunking, and vectors embeddings into Pinecone RAG.")}
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
                  {t("settingsTraining.plainText", "Plain Text (.txt, .md)")}
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
                      {formatFileSize(selectedFile.size)} • {t("settingsTraining.readyToTrain", "Ready to parse and vectorize")}
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
                    {t("common.cancel", "Cancel")}
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
                        <span>{t("settingsTraining.trainingProcessing", "Processing & Vectorizing...")}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3.5" />
                        <span>{t("settingsTraining.startTraining", "Start AI Training")}</span>
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
                <span>{t("settingsTraining.pdfFile", "PDF Document")}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("settingsTraining.pdfDesc", "Optimized for user manuals, warranty policies, refund rules, and services. Automatically splits into semantic chunks.")}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs">
                <FileSpreadsheet className="size-4" />
                <span>{t("settingsTraining.excelFile", "Excel Spreadsheet (.xlsx, .xls, .csv)")}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("settingsTraining.excelDesc", "Optimized for product price lists, technical specifications, and inventory. Row headers are bound for maximum precision.")}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1.5">
              <div className="flex items-center gap-2 text-blue-500 font-semibold text-xs">
                <File className="size-4" />
                <span>{t("settingsTraining.plainText", "Plain Text (.txt, .md)")}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("settingsTraining.plainTextDesc", "Optimized for quick notes, raw consultation scripts, and SOP workflows.")}
              </p>
            </div>
          </div>

          {/* List of Trained Documents */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {t("settingsTraining.trainedDocsList", { count: documents.length }, `Trained Knowledge Documents (${documents.length})`)}
              </h3>
              {documents.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {t("settingsTraining.totalChunks", { count: documents.reduce((acc, d) => acc + d.num_chunks, 0) }, `Total: ${documents.reduce((acc, d) => acc + d.num_chunks, 0)} RAG knowledge chunks`)}
                </span>
              )}
            </div>

            {isLoadingDocs ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                {t("settingsTraining.faqLoading", "Loading documents...")}
              </div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl space-y-2">
                <BookOpen className="size-8 text-muted-foreground/40 mx-auto" />
                <p className="font-semibold text-foreground">{t("settingsTraining.emptyDocsTitle", "No documents trained yet")}</p>
                <p className="max-w-md mx-auto text-xs">
                  {t("settingsTraining.emptyDocsDesc", "Upload PDF policies, Excel price lists, or TXT notes above so your AI bot learns deeper business knowledge.")}
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
                            {t("settingsTraining.trainedStatus", "Trained")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>•</span>
                          <span className="text-brand-accent font-medium">
                            {t("settingsTraining.chunksUnit", { count: doc.num_chunks }, `${doc.num_chunks} chunks`)}
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
                        title={t("settingsTraining.viewChunks", "View Knowledge Chunks")}
                      >
                        <Eye className="size-3.5" />
                        <span>{t("settingsTraining.viewChunks", "View Knowledge Chunks")}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => retrainDocument(doc.id)}
                        disabled={isRetrainingDoc}
                        className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                        title={t("settingsTraining.reindex", "Re-train")}
                      >
                        <RefreshCw
                          className={`size-3.5 ${isRetrainingDoc ? "animate-spin" : ""}`}
                        />
                        <span className="hidden sm:inline">{t("settingsTraining.reindex", "Re-train")}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDocument(doc.id)}
                        disabled={isDeletingDoc}
                        className="h-8 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40"
                        title={t("settingsTraining.deleteDoc", "Delete document and vectors")}
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
                        {t("settingsTraining.chunksModalDesc", { count: chunks.length }, `Total ${chunks.length} knowledge chunks extracted and indexed`)}
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
                      {t("settingsTraining.faqLoading", "Loading chunks...")}
                    </div>
                  ) : chunks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      {t("settingsTraining.emptyChunks", "No chunk content found.")}
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
                            {t("settingsTraining.charUnit", { count: chunk.content.length }, `${chunk.content.length} characters`)}
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
                    {t("common.close", "Close")}
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

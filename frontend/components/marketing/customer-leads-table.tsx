"use client";

import React, { useMemo } from "react";
import {
  CheckSquareIcon,
  CopyIcon,
  FilterIcon,
  GlobeIcon,
  HelpCircleIcon,
  MailIcon,
  SearchIcon,
  SquareIcon,
  UserCheckIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomerLead } from "@/types/marketing";

interface DomainOption {
  id: string;
  name: string;
}

interface CustomerLeadsTableProps {
  leads: CustomerLead[];
  isLoading?: boolean;
  domains?: DomainOption[];
  selectedDomainId: string;
  onSelectDomain: (domainId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedEmails: string[];
  onToggleSelectEmail: (email: string) => void;
  onToggleSelectAll: (allEmails: string[]) => void;
  onClearSelection: () => void;
  onInspectLead: (lead: CustomerLead) => void;
}

export function CustomerLeadsTable({
  leads,
  isLoading = false,
  domains = [],
  selectedDomainId,
  onSelectDomain,
  searchQuery,
  onSearchChange,
  selectedEmails,
  onToggleSelectEmail,
  onToggleSelectAll,
  onClearSelection,
  onInspectLead,
}: CustomerLeadsTableProps) {
  // All valid emails currently listed in table
  const tableEmails = useMemo(() => {
    return leads.map((l) => l.email).filter(Boolean) as string[];
  }, [leads]);

  const areAllSelected =
    tableEmails.length > 0 && tableEmails.every((e) => selectedEmails.includes(e));

  const someSelected =
    tableEmails.some((e) => selectedEmails.includes(e)) && !areAllSelected;

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success("Đã sao chép email!");
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 space-y-4 shadow-2xs">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
              <UsersIcon className="size-4 text-primary" />
              Danh sách Leads & Khách hàng
            </h2>
            <Badge variant="secondary" className="text-[10px] font-medium">
              {leads.length} khách
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Lọc khách hàng tiềm năng qua câu hỏi sàng lọc và chọn để gửi email hàng loạt
          </p>
        </div>

        {/* Selection Count Badge & Clear */}
        {selectedEmails.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs py-1 px-2.5">
              <UserCheckIcon className="size-3.5 mr-1" />
              Đã chọn {selectedEmails.length} email
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              title="Bỏ chọn tất cả"
            >
              <XIcon className="size-3.5 mr-1" />
              Bỏ chọn
            </Button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Domain Filter Dropdown */}
        <div className="relative shrink-0 w-full sm:w-48">
          <select
            value={selectedDomainId}
            onChange={(e) => onSelectDomain(e.target.value)}
            className="w-full h-8.5 rounded-lg border border-border/70 bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-8"
          >
            <option value="all">Tất cả Domain ({domains.length})</option>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <FilterIcon className="size-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Search Input */}
        <div className="relative flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo email hoặc nội dung câu trả lời..."
            className="h-8.5 pl-8 text-xs"
          />
          <SearchIcon className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>

        {/* Toggle Select All Button */}
        {tableEmails.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleSelectAll(tableEmails)}
            className="h-8.5 px-3 text-xs shrink-0"
          >
            {areAllSelected ? (
              <>
                <SquareIcon className="size-3.5 mr-1 text-primary" />
                Bỏ chọn trang này
              </>
            ) : (
              <>
                <CheckSquareIcon className="size-3.5 mr-1 text-primary" />
                Chọn tất cả ({tableEmails.length})
              </>
            )}
          </Button>
        )}
      </div>

      {/* Table Area */}
      <div className="rounded-lg border border-border/70 overflow-hidden">
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-muted/40 border-b border-border/70 sticky top-0 z-10">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={areAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={() => onToggleSelectAll(tableEmails)}
                    className="size-3.5 rounded border-border/80 text-primary focus:ring-primary cursor-pointer"
                  />
                </th>
                <th className="p-3 font-semibold text-muted-foreground">Email Khách hàng</th>
                <th className="p-3 font-semibold text-muted-foreground hidden sm:table-cell">
                  Domain
                </th>
                <th className="p-3 font-semibold text-muted-foreground text-center">
                  Khảo sát Lead
                </th>
                <th className="p-3 font-semibold text-muted-foreground text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground text-xs">
                    Đang tải danh sách khách hàng tiềm năng...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground text-xs">
                    Không tìm thấy khách hàng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const isChecked = !!(lead.email && selectedEmails.includes(lead.email));
                  const hasResponses = lead.responses && lead.responses.length > 0;
                  const isFullyQualified =
                    lead.total_questions > 0 && lead.answered_count === lead.total_questions;

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => lead.email && onToggleSelectEmail(lead.email)}
                      className={`cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-primary/5 hover:bg-primary/10"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!lead.email}
                          onChange={() => lead.email && onToggleSelectEmail(lead.email)}
                          className="size-3.5 rounded border-border/80 text-primary focus:ring-primary cursor-pointer disabled:opacity-40"
                        />
                      </td>

                      {/* Email info */}
                      <td className="p-3 font-medium text-foreground">
                        <div className="flex items-center gap-1.5">
                          <MailIcon className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[200px] sm:max-w-[260px]">
                            {lead.email || "Khách chưa để lại email"}
                          </span>
                          {lead.email && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyEmail(lead.email!);
                              }}
                              className="text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 p-0.5"
                              title="Sao chép email"
                            >
                              <CopyIcon className="size-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Domain */}
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">
                        <span className="flex items-center gap-1 truncate max-w-[140px]">
                          <GlobeIcon className="size-3 text-muted-foreground shrink-0" />
                          {lead.domain_name || "Mặc định"}
                        </span>
                      </td>

                      {/* Lead qualification answers status */}
                      <td className="p-3 text-center">
                        {hasResponses ? (
                          <Badge
                            variant={isFullyQualified ? "default" : "secondary"}
                            className={`text-[10px] font-medium ${
                              isFullyQualified
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : ""
                            }`}
                          >
                            {lead.answered_count}/{lead.total_questions} câu trả lời
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            Chưa có khảo sát
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onInspectLead(lead)}
                          className="h-7 px-2 text-[11px] font-medium text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <HelpCircleIcon className="size-3 mr-1" />
                          Xem câu trả lời
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

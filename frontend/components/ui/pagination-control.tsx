"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  itemLabel?: string;
}

export function PaginationControl({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className = "",
  itemLabel = "mục",
}: PaginationControlProps) {
  // If no pages at all or only 1 page with no items, hide or show minimal
  if (totalPages <= 1 && (!totalItems || totalItems <= (pageSize || 10))) {
    if (totalItems !== undefined && totalItems > 0) {
      return (
        <div
          className={`flex items-center justify-between text-xs text-muted-foreground py-2 px-1 ${className}`}
        >
          <span>
            Hiển thị toàn bộ {totalItems} {itemLabel}
          </span>
        </div>
      );
    }
    return null;
  }

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const startItem =
    totalItems && pageSize
      ? Math.min((currentPage - 1) * pageSize + 1, totalItems)
      : null;
  const endItem =
    totalItems && pageSize
      ? Math.min(currentPage * pageSize, totalItems)
      : null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground pt-3 border-t border-border/60 ${className}`}
    >
      {/* Items range information */}
      <div className="flex items-center gap-3">
        {totalItems !== undefined && startItem !== null && endItem !== null ? (
          <span className="tabular-nums">
            Hiển thị <span className="font-medium text-foreground">{startItem}</span> -{" "}
            <span className="font-medium text-foreground">{endItem}</span> trên{" "}
            <span className="font-medium text-foreground">{totalItems}</span> {itemLabel}
          </span>
        ) : (
          <span className="tabular-nums">
            Trang <span className="font-medium text-foreground">{currentPage}</span> /{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </span>
        )}

        {/* Page size dropdown */}
        {onPageSizeChange && pageSize && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
            <span className="text-[11px] hidden sm:inline">Mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="h-7 text-xs bg-background border border-border/80 rounded px-1.5 py-0.5 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="size-7.5 cursor-pointer disabled:pointer-events-none"
          title="Trang đầu"
        >
          <ChevronsLeftIcon className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="size-7.5 cursor-pointer disabled:pointer-events-none"
          title="Trang trước"
        >
          <ChevronLeftIcon className="size-3.5" />
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((p, idx) =>
            typeof p === "number" ? (
              <Button
                key={idx}
                variant={p === currentPage ? "default" : "ghost"}
                size="icon"
                onClick={() => onPageChange(p)}
                className={`size-7.5 text-xs cursor-pointer font-medium tabular-nums ${
                  p === currentPage
                    ? "pointer-events-none font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </Button>
            ) : (
              <span key={idx} className="px-1 text-muted-foreground/60 select-none">
                ...
              </span>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="size-7.5 cursor-pointer disabled:pointer-events-none"
          title="Trang sau"
        >
          <ChevronRightIcon className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="size-7.5 cursor-pointer disabled:pointer-events-none"
          title="Trang cuối"
        >
          <ChevronsRightIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

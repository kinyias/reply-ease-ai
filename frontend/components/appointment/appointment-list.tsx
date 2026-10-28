"use client";

import React, { useMemo, useState } from "react";
import {
  CalendarIcon,
  ClockIcon,
  GlobeIcon,
  MailIcon,
  SearchIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Appointment } from "@/types/dashboard";
import { formatDate, formatDateOnly } from "@/lib/utils";

interface AppointmentListProps {
  appointments?: Appointment[];
  isLoading?: boolean;
}

export function AppointmentList({
  appointments = [],
  isLoading,
}: AppointmentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Extract unique domains for filter
  const uniqueDomains = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((a) => {
      if (a.domain_name) set.add(a.domain_name);
    });
    return Array.from(set);
  }, [appointments]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const matchSearch =
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.domain_name &&
          item.domain_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.slot.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDomain =
        selectedDomain === "ALL" || item.domain_name === selectedDomain;

      return matchSearch && matchDomain;
    });
  }, [appointments, searchTerm, selectedDomain]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));

  // Auto adjust page if out of bounds
  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedAppointments = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredAppointments.slice(startIndex, startIndex + pageSize);
  }, [filteredAppointments, page, pageSize]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handleDomainChange = (val: string) => {
    setSelectedDomain(val);
    setPage(1);
  };


  return (
    <Card className="border border-border/80 bg-card shadow-none">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <CalendarIcon className="size-4 text-muted-foreground" />
              <span>Danh sách Lịch hẹn Khách hàng ({filteredAppointments.length})</span>
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Toàn bộ lịch tư vấn được khách hàng đặt qua chatbot và portal
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-60">
              <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm email, domain, giờ..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            {uniqueDomains.length > 1 && (
              <select
                value={selectedDomain}
                onChange={(e) => handleDomainChange(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              >
                <option value="ALL">Tất cả website</option>
                {uniqueDomains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-2">
            <div className="size-11 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto mb-2">
              <CalendarIcon className="size-5" />
            </div>
            <h4 className="text-sm font-medium text-foreground">
              {searchTerm || selectedDomain !== "ALL"
                ? "Không tìm thấy lịch hẹn phù hợp"
                : "Chưa có lịch hẹn nào được ghi nhận"}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchTerm || selectedDomain !== "ALL"
                ? "Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để hiển thị toàn bộ."
                : "Khi khách hàng trò chuyện với AI Bot và chọn đặt lịch tư vấn, toàn bộ cuộc hẹn sẽ được lưu trữ tự động tại đây."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="py-2.5 px-4">Khách hàng</th>
                  <th className="py-2.5 px-4">Website / Domain</th>
                  <th className="py-2.5 px-4">Ngày hẹn</th>
                  <th className="py-2.5 px-4">Khung giờ</th>
                  <th className="py-2.5 px-4">Ngày đặt lịch</th>
                  <th className="py-2.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {paginatedAppointments.map((b) => {
                  const initial = b.email ? b.email[0].toUpperCase() : "U";
                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-muted/30 transition-colors duration-100"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-7 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-xs text-foreground shrink-0">
                            {initial}
                          </div>
                          <span className="font-medium text-foreground truncate max-w-[200px]">
                            {b.email}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground">
                        {b.domain_name ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                            <GlobeIcon className="size-3 text-muted-foreground" />
                            <span>{b.domain_name}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">
                            Chưa gán
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 tabular-nums font-medium text-foreground whitespace-nowrap">
                        {formatDateOnly(b.date)}
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className="border-primary/20 bg-primary/5 text-primary font-medium text-[11px] gap-1 px-2 py-0.5 whitespace-nowrap"
                        >
                          <ClockIcon className="size-2.5" />
                          <span>{b.slot}</span>
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatDate(b.created_at)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <a href={`mailto:${b.email}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs font-medium gap-1 text-primary hover:text-primary/90 hover:bg-primary/5 cursor-pointer"
                          >
                            <MailIcon className="size-3" />
                            <span>Email</span>
                          </Button>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && filteredAppointments.length > 0 && (
          <div className="p-4 pt-1">
            <PaginationControl
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredAppointments.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
              itemLabel="lịch hẹn"
            />
          </div>
        )}
      </CardContent>
    </Card>

  );
}

export default AppointmentList;

"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRightIcon, CreditCardIcon, RefreshCwIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardTransaction } from "@/types/dashboard";
import { formatDate, formatVND } from "@/lib/utils";

interface RecentTransactionsTableProps {
  transactions?: DashboardTransaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function RecentTransactionsTable({
  transactions = [],
  isLoading,
  onRefresh,
}: RecentTransactionsTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return (
          <Badge
            variant="outline"
            className="border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium text-[11px]"
          >
            Thành công
          </Badge>
        );
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="border-amber-600/30 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium text-[11px]"
          >
            Đang chờ
          </Badge>
        );
      case "FAILED":
      default:
        return (
          <Badge
            variant="outline"
            className="border-rose-600/30 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium text-[11px]"
          >
            Thất bại
          </Badge>
        );
    }
  };

  const getTypeText = (type: string) => {
    switch (type.toUpperCase()) {
      case "SUBSCRIPTION":
        return "Nâng cấp Gói cước";
      case "PRODUCT_CHECKOUT":
        return "Khách mua hàng";
      default:
        return type;
    }
  };

  return (
    <Card className="border border-border/80 bg-card shadow-none">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <CreditCardIcon className="size-4 text-muted-foreground" />
              <span>Giao dịch Thanh toán SePay gần nhất</span>
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Lịch sử biến động thanh toán subscription và đơn hàng qua VietQR
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                className="size-8 text-muted-foreground hover:text-foreground"
                title="Làm mới danh sách"
              >
                <RefreshCwIcon className="size-3.5" />
              </Button>
            )}
            <Link href="/billing">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-primary hover:text-primary/90 font-medium hover:bg-primary/5 gap-1"
              >
                <span>Xem tất cả</span>
                <ArrowUpRightIcon className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <div className="inline-flex items-center justify-center size-10 rounded-full bg-muted/60 text-muted-foreground mb-1">
              <CreditCardIcon className="size-5" />
            </div>
            <h4 className="text-sm font-medium text-foreground">
              Chưa có giao dịch phát sinh
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Khi khách hàng quét mã VietQR mua hàng hoặc bạn nâng cấp gói cước qua SePay, thông tin đối soát sẽ hiển thị tự động tại đây.
            </p>
            <div className="pt-2">
              <Link href="/integration">
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Cấu hình SePay Merchant
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="py-2.5 px-4">Mã giao dịch</th>
                  <th className="py-2.5 px-4">Loại thanh toán</th>
                  <th className="py-2.5 px-4">Kênh / Domain</th>
                  <th className="py-2.5 px-4">Thời gian</th>
                  <th className="py-2.5 px-4 text-right">Số tiền</th>
                  <th className="py-2.5 px-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-muted/30 transition-colors duration-100"
                  >
                    <td className="py-3 px-4 font-medium text-foreground tabular-nums">
                      {tx.order_code}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {getTypeText(tx.payment_type)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {tx.domain_name ? (
                        <span className="font-medium text-foreground">{tx.domain_name}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Hệ thống</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground tabular-nums whitespace-nowrap">
                      {formatDate(tx.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold tabular-nums text-foreground">
                      {formatVND(tx.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(tx.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentTransactionsTable;

"use client";

import React from "react";
import { ClockIcon, ReceiptIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PaymentTransactionItem } from "@/types/payment";

interface TransactionHistoryTableProps {
  transactions: PaymentTransactionItem[];
  isLoading?: boolean;
}

export function TransactionHistoryTable({
  transactions,
  isLoading = false,
}: TransactionHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Đang tải lịch sử giao dịch...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
        <div className="size-12 rounded-xl bg-muted/50 text-muted-foreground flex items-center justify-center mx-auto mb-3">
          <ReceiptIcon className="size-6 stroke-[1.5]" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">Chưa có giao dịch nào</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
          Các giao dịch nâng cấp gói cước và thanh toán SePay VietQR sẽ hiển thị tại đây sau khi bạn thực hiện thanh toán.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground font-medium uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Mã đơn hàng</th>
              <th className="py-3 px-4">Loại giao dịch</th>
              <th className="py-3 px-4 text-right">Số tiền</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4">Mã SePay / Tham chiếu</th>
              <th className="py-3 px-4 text-right">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {transactions.map((tx) => {
              const formattedDate = new Date(tx.created_at).toLocaleString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });

              const isSuccess = tx.status === "SUCCESS";
              const isPending = tx.status === "PENDING";

              return (
                <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                  {/* Order Code */}
                  <td className="py-3 px-4 font-mono font-medium text-foreground">
                    {tx.order_code}
                  </td>

                  {/* Payment Type */}
                  <td className="py-3 px-4 text-muted-foreground">
                    {tx.payment_type === "SUBSCRIPTION" ? (
                      <span className="text-foreground font-medium">Nâng cấp gói cước</span>
                    ) : (
                      <span>Đơn hàng sản phẩm</span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-4 text-right font-semibold text-foreground">
                    {tx.amount.toLocaleString("vi-VN")} đ
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4 text-center">
                    {isSuccess ? (
                      <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        Thành công
                      </Badge>
                    ) : isPending ? (
                      <Badge variant="outline" className="text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1 mx-auto w-fit">
                        <ClockIcon className="size-2.5" />
                        <span>Chờ thanh toán</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] bg-destructive/10 text-destructive border-destructive/30">
                        Thất bại
                      </Badge>
                    )}
                  </td>

                  {/* Reference ID */}
                  <td className="py-3 px-4 font-mono text-muted-foreground">
                    {tx.sepay_transaction_id || "—"}
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4 text-right text-muted-foreground">
                    {formattedDate}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

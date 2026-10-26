"use client";

import * as React from "react";
import Image from "next/image";
import { MessageSquarePlusIcon, PackageIcon, ShoppingBagIcon } from "lucide-react";
import { ChatbotProductItem } from "@/types/chatbot";

interface ProductsTabProps {
  products: ChatbotProductItem[];
  themeColor?: string | null;
  onInquireProduct: (productName: string) => void;
}

export function ProductsTab({
  products,
  themeColor,
  onInquireProduct,
}: ProductsTabProps) {
  const accentColor = themeColor || "#ff7a00";

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Header bar */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          <ShoppingBagIcon className="size-3.5 text-orange-500" />
          <span>Danh mục Sản phẩm & Dịch vụ ({products.length})</span>
        </div>
      </div>

      {/* Product list */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-2">
            <PackageIcon className="size-8 text-zinc-300 dark:text-zinc-600" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Chưa có sản phẩm nào được thiết lập.
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Chủ website có thể thêm sản phẩm trong trang Cài đặt Domain.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="group rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs hover:border-orange-500/40 transition-all flex flex-col"
              >
                {/* Product Image */}
                <div className="relative w-full h-28 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, 200px"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-zinc-400">
                      <PackageIcon className="size-6 opacity-60" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                      {product.name}
                    </h4>
                    <p
                      style={{ color: accentColor }}
                      className="text-xs font-bold mt-1"
                    >
                      {product.price.toLocaleString("vi-VN")} đ
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onInquireProduct(
                        `Tôi quan tâm đến sản phẩm "${product.name}" với giá ${product.price.toLocaleString("vi-VN")} đ. Tư vấn thêm giúp tôi!`
                      )
                    }
                    className="w-full mt-1 py-1.5 px-2.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageSquarePlusIcon className="size-3" />
                    <span>Hỏi tư vấn</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

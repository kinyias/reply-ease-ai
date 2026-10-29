"use client";

import * as React from "react";
import Image from "next/image";
import { MessageSquarePlusIcon, PackageIcon, ShoppingBagIcon, SearchIcon, XIcon } from "lucide-react";
import { ChatbotProductItem } from "@/types/chatbot";
import { useI18n } from "@/context/i18n-context";

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
  const { t, locale } = useI18n();
  const [searchQuery, setSearchQuery] = React.useState("");
  const accentColor = themeColor || "#ff7a00";

  const filteredProducts = React.useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.price.toString().includes(q)
    );
  }, [products, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Header bar */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          <ShoppingBagIcon className="size-3.5 text-orange-500" />
          <span>{t("chatbot.productsTitle", { filtered: filteredProducts.length, total: searchQuery ? `/${products.length}` : "" })}</span>
        </div>
      </div>

      {/* Search bar */}
      {products.length > 0 && (
        <div className="p-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 shrink-0">
          <div className="relative flex items-center">
            <SearchIcon className="size-3.5 absolute left-3 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("chatbot.productsSearchPlaceholder", "Search products, services...")}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-orange-500/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                title={t("chatbot.productsClearSearch", "Clear search")}
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Product list */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-2">
            <PackageIcon className="size-8 text-zinc-300 dark:text-zinc-600" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {t("chatbot.productsEmptyAll", "No products configured yet.")}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {t("chatbot.productsEmptyAllHint")}
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-2">
            <SearchIcon className="size-8 text-zinc-300 dark:text-zinc-600" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {t("chatbot.productsEmptySearch", "No products match your query.")}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {t("chatbot.productsEmptySearchHint", { query: searchQuery })}
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-2 text-xs text-orange-600 dark:text-orange-400 hover:underline cursor-pointer font-medium"
            >
              {t("chatbot.productsClearSearch", "Clear search")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
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
                        t("chatbot.productsInquirePrompt", { name: product.name, price: `${product.price.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} đ` })
                      )
                    }
                    className="w-full mt-1 py-1.5 px-2.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageSquarePlusIcon className="size-3" />
                    <span>{t("chatbot.productsInquireBtn", "Inquire")}</span>
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

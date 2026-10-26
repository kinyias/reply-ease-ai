"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  GlobeIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDomainManagement } from "@/hooks/sidebar/use-domain-management";
import { AddDomainModal } from "@/components/sidebar/add-domain-modal";

interface DomainSwitcherProps {
  isCollapsed?: boolean;
}

export function DomainSwitcher({ isCollapsed }: DomainSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { domains, quota, isLoading } = useDomainManagement();

  const [isOpen, setIsOpen] = React.useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine current active domain from URL (e.g. /settings/gadget-store.vn) or default to first domain
  const activeDomain = React.useMemo(() => {
    const match = pathname.match(/\/settings\/([^/]+)/);
    if (match && match[1]) {
      const found = domains.find(
        (d) =>
          d.name.toLowerCase() === match[1].toLowerCase() || d.id === match[1]
      );
      if (found) return found;
    }
    return domains[0] || null;
  }, [pathname, domains]);

  const handleSelectDomain = (domainName: string) => {
    setIsOpen(false);
    router.push(`/settings/${domainName}`);
  };

  if (isLoading && domains.length === 0) {
    return (
      <div className="h-12 rounded-xl bg-muted/40 animate-pulse border border-border/40" />
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 p-2 rounded-xl border border-border/60 bg-card hover:bg-muted/40 transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          isCollapsed ? "justify-center px-2" : ""
        }`}
        title={activeDomain ? activeDomain.name : "Chọn domain"}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative size-7 rounded-lg overflow-hidden bg-muted/80 border border-border/80 shrink-0 flex items-center justify-center">
            {activeDomain?.icon ? (
              <Image
                src={activeDomain.icon}
                alt={activeDomain.name}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <GlobeIcon className="size-4 text-muted-foreground" />
            )}
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-xs font-semibold text-foreground truncate">
                {activeDomain ? activeDomain.name : "Chưa có domain"}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {quota ? `Gói ${quota.plan}` : "Quản lý website"}
              </span>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <ChevronsUpDownIcon className="size-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-64 rounded-xl border border-border/80 bg-background/95 backdrop-blur-md p-2 shadow-xl z-50 space-y-2 animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header & Quota */}
          <div className="px-2 py-1.5 border-b border-border/40 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Domain khả dụng</span>
              {quota && (
                <span className="font-semibold text-foreground">
                  {quota.used_domains}/{quota.max_domains}
                </span>
              )}
            </div>

            {quota && (
              <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      (quota.used_domains / Math.max(quota.max_domains, 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            )}
          </div>

          {/* Domain list */}
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {domains.map((dom) => {
              const isSelected = activeDomain?.id === dom.id;

              return (
                <button
                  key={dom.id}
                  type="button"
                  onClick={() => handleSelectDomain(dom.name)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative size-5 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center border border-border/40">
                      {dom.icon ? (
                        <Image
                          src={dom.icon}
                          alt={dom.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <GlobeIcon className="size-3 text-muted-foreground" />
                      )}
                    </div>
                    <span className="truncate">{dom.name}</span>
                  </div>

                  {isSelected && <CheckIcon className="size-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Action: Add domain */}
          <div className="pt-1 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                setIsAddModalOpen(true);
              }}
              className="w-full justify-start text-xs h-8 text-primary hover:text-primary hover:bg-primary/10 gap-1.5 font-medium"
            >
              <PlusIcon className="size-3.5" />
              <span>Thêm Domain mới</span>
            </Button>

            {quota && !quota.can_create_domain && (
              <div className="mt-1 px-2 py-1 rounded-md bg-muted/40 text-[10px] text-muted-foreground flex items-center gap-1">
                <SparklesIcon className="size-3 text-amber-500 shrink-0" />
                <span>Nâng cấp gói để mở thêm domain</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Domain Modal */}
      <AddDomainModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={(name) => {
          router.push(`/settings/${name}`);
        }}
      />
    </div>
  );
}

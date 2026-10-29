"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/context/i18n-context";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MailIcon,
  MessageSquareIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DomainSwitcher } from "@/components/sidebar/domain-switcher";
import { useCurrentUser } from "@/hooks/auth/use-user";
import { useDomainManagement } from "@/hooks/sidebar/use-domain-management";
import { authService } from "@/services/auth-service";

interface AppSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ mobileOpen = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { domains } = useDomainManagement();
  const { t } = useI18n();

  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Close mobile drawer when route changes
  React.useEffect(() => {
    if (onClose) {
      onClose();
    }
  }, [pathname, onClose]);

  // Active domain name for link routing
  const activeDomainName = React.useMemo(() => {
    const match = pathname.match(/\/settings\/([^/]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return domains[0]?.name || "default";
  }, [pathname, domains]);

  const NAV_ITEMS = [
    {
      label: t("nav.overview", "Overview"),
      href: "/dashboard",
      icon: LayoutDashboardIcon,
      isActive: pathname === "/dashboard",
    },
    {
      label: t("nav.conversations", "Live Conversations"),
      href: "/conversations",
      icon: MessageSquareIcon,
      isActive: pathname.startsWith("/conversations"),
    },
    {
      label: t("nav.appointments", "Appointments"),
      href: "/appointment",
      icon: CalendarIcon,
      isActive: pathname.startsWith("/appointment"),
    },
    {
      label: t("nav.settings", "Domain & Bot Settings"),
      href: `/settings/${activeDomainName}`,
      icon: SettingsIcon,
      isActive: pathname.startsWith("/settings"),
    },
    {
      label: t("nav.marketing", "Email Marketing"),
      href: "/marketing",
      icon: MailIcon,
      isActive: pathname.startsWith("/marketing"),
    },
    {
      label: t("nav.billing", "Plans & SePay"),
      href: "/billing",
      icon: CreditCardIcon,
      isActive: pathname.startsWith("/billing"),
    },
    {
      label: t("nav.integration", "Shop Integration"),
      href: "/integration",
      icon: ShieldCheckIcon,
      isActive: pathname.startsWith("/integration"),
    },
  ];

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success(t("nav.logoutSuccess", "Signed out successfully"));
      router.push("/auth/sign-in");
    } catch {
      toast.error(t("nav.logoutError", "Error signing out"));
    }
  };

  const sidebarContent = (
    <aside
      className={`h-screen sticky top-0 flex flex-col justify-between border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200 z-40 ${
        isCollapsed ? "w-18" : "w-64"
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col gap-4 p-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-2">
          {!isCollapsed ? (
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 shadow-xs shrink-0">
                <Image
                  src="/icons/logo.png"
                  alt="ReplyEase AI"
                  width={32}
                  height={32}
                  className="size-full object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                  ReplyEase <span className="text-primary font-bold">AI</span>
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {t("nav.brandTagline", "Autonomous Sales & Support")}
                </span>
              </div>
            </Link>
          ) : (
            <div className="mx-auto size-8 rounded-lg overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 shadow-xs">
              <Image
                src="/icons/logo.png"
                alt="ReplyEase AI"
                width={32}
                height={32}
                className="size-full object-contain"
                priority
              />
            </div>
          )}

          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="size-7 text-muted-foreground hover:text-sidebar-foreground hidden sm:flex"
            title={isCollapsed ? t("nav.expandSidebar", "Expand sidebar") : t("nav.collapseSidebar", "Collapse sidebar")}
          >
            {isCollapsed ? (
              <PanelLeftOpenIcon className="size-4" />
            ) : (
              <PanelLeftCloseIcon className="size-4" />
            )}
          </Button>

          {/* Mobile close button */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-7 text-muted-foreground hover:text-sidebar-foreground sm:hidden"
            >
              <XIcon className="size-4" />
            </Button>
          )}
        </div>

        {/* Domain Switcher */}
        <DomainSwitcher isCollapsed={isCollapsed} />

        {/* Navigation Menu */}
        <nav className="flex flex-col space-y-1 pt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  item.isActive
                    ? "bg-sidebar-accent text-sidebar-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                } ${isCollapsed ? "justify-center px-2" : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`size-4 shrink-0 ${
                    item.isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-sidebar-border bg-sidebar">
        <div
          className={`flex items-center gap-3 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0 border border-primary/20">
              {user?.fullname
                ? user.fullname.slice(0, 2).toUpperCase()
                : "RE"}
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-sidebar-foreground truncate">
                    {user?.fullname || t("common.user", "User")}
                  </span>
                  {(user?.type === "demo" || user?.is_demo || user?.email?.startsWith("demo_")) && (
                    <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded shrink-0">
                      Demo
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground truncate">
                  {user?.email || t("nav.notLoggedIn", "Not signed in")}
                </span>
              </div>
            )}
          </div>

          {!isCollapsed ? (
            <div className="flex items-center gap-1 shrink-0">
              <LanguageToggle />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                title={t("nav.logout", "Sign Out")}
              >
                <LogOutIcon className="size-3.5" />
              </Button>
            </div>
          ) : (
            <div className="mt-2 flex flex-col items-center gap-1">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden sm:block">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={onClose}
          />
          <div className="relative z-50 h-full w-64 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

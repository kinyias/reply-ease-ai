"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground hover:text-sidebar-foreground"
        title="Giao diện sáng (Light Theme)"
      >
        <SunIcon className="size-3.5" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="size-7 text-muted-foreground hover:text-sidebar-foreground"
      title={isDark ? "Chuyển sang giao diện sáng (Light Theme)" : "Chuyển sang giao diện tối (Dark Theme)"}
    >
      {isDark ? (
        <SunIcon className="size-3.5 text-amber-500" />
      ) : (
        <MoonIcon className="size-3.5" />
      )}
    </Button>
  );
}

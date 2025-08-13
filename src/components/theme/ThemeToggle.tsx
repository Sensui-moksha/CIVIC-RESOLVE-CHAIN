import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const current = theme === "system" ? systemTheme : theme;
  const isDark = current === "dark";

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-full border bg-card/60 backdrop-blur-md shadow-sm">
      <Sun className="text-muted-foreground" />
      <Switch
        aria-label="Toggle dark mode"
        checked={!!isDark}
        onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
      />
      <Moon className="text-muted-foreground" />
      <Label className="text-xs text-muted-foreground select-none">{isDark ? "Dark" : "Light"}</Label>
    </div>
  );
};

export default ThemeToggle;

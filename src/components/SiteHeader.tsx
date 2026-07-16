import { Link } from "@tanstack/react-router";
import { Sun, Moon, Globe } from "lucide-react";
import { FeedbackDialog } from "./FeedbackDialog";
import { useTranslation } from "../lib/translations";
import { useLocalStorage } from "../hooks/use-local-storage";
import { DEFAULT_SETTINGS, KEYS, Settings } from "../lib/store";
import { Button } from "./ui/button";

export function SiteHeader() {
  const { t } = useTranslation();
  const {
    value: settings,
    setValue: setSettings,
    hydrated,
  } = useLocalStorage<Settings>(KEYS.settings, DEFAULT_SETTINGS);

  const toggleTheme = () => {
    if (!hydrated) return;
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark",
    }));
  };

  const toggleLanguage = () => {
    if (!hydrated) return;
    setSettings((prev) => ({
      ...prev,
      lang: prev.lang === "en" ? "ar" : "en",
    }));
  };

  const linkClass =
    "text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md";
  const activeClass = "text-foreground font-medium bg-accent";

  return (
    <header
      className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40"
      dir="ltr"
    >
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <img
            src="./logo.png"
            className="h-6 w-6 rounded-md object-cover border border-border/50"
            alt="Focus & Earn Logo"
          />
          <span className="hidden sm:inline">{t("appName")}</span>
        </Link>
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={linkClass}
              activeOptions={{ exact: true }}
              activeProps={{ className: `${linkClass} ${activeClass}` }}
            >
              {t("timer")}
            </Link>
            <Link
              to="/stats"
              className={linkClass}
              activeProps={{ className: `${linkClass} ${activeClass}` }}
            >
              {t("stats")}
            </Link>
            <Link
              to="/settings"
              className={linkClass}
              activeProps={{ className: `${linkClass} ${activeClass}` }}
            >
              {t("settings")}
            </Link>
          </nav>

          <div className="flex items-center gap-1 border-l border-border pl-3 ml-1">
            {/* Theme Switcher Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={toggleTheme}
              title={settings.theme === "dark" ? t("light") : t("dark")}
            >
              {hydrated && settings.theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Language Switcher Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 flex items-center gap-1 text-muted-foreground hover:text-foreground font-semibold text-xs cursor-pointer"
              onClick={toggleLanguage}
              title={settings.lang === "en" ? "العربية" : "English"}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{hydrated && settings.lang === "en" ? "AR" : "EN"}</span>
            </Button>
          </div>

          <FeedbackDialog />
        </div>
      </div>
    </header>
  );
}

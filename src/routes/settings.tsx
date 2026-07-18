import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { DEFAULT_SETTINGS, KEYS, Settings } from "@/lib/store";
import { useTranslation } from "@/lib/translations";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Focus & Earn" },
      { name: "description", content: "Configure timer durations, hourly rate, and currency." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const { value, setValue, hydrated, reset } = useLocalStorage<Settings>(
    KEYS.settings,
    DEFAULT_SETTINGS,
  );

  if (!hydrated) return <div className="text-muted-foreground text-sm">{t("loading")}</div>;

  const update = <K extends keyof Settings>(key: K, v: Settings[K]) =>
    setValue({ ...value, [key]: v });

  const num = (v: string, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Preferences Card (Theme & Language) */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium text-sm sm:text-base">{t("theme")}</div>
              <div className="text-xs text-muted-foreground">{t("themeDesc")}</div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <Button
                variant={value.theme === "light" ? "default" : "outline"}
                size="sm"
                className="flex-1 sm:flex-none px-4"
                onClick={() => update("theme", "light")}
              >
                {t("light")}
              </Button>
              <Button
                variant={value.theme === "dark" ? "default" : "outline"}
                size="sm"
                className="flex-1 sm:flex-none px-4"
                onClick={() => update("theme", "dark")}
              >
                {t("dark")}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-border">
            <div>
              <div className="font-medium text-sm sm:text-base">{t("language")}</div>
              <div className="text-xs text-muted-foreground">{t("languageDesc")}</div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <Button
                variant={value.lang === "en" ? "default" : "outline"}
                size="sm"
                className="flex-1 sm:flex-none px-4"
                onClick={() => update("lang", "en")}
              >
                {t("english")}
              </Button>
              <Button
                variant={value.lang === "ar" ? "default" : "outline"}
                size="sm"
                className="flex-1 sm:flex-none px-4"
                onClick={() => update("lang", "ar")}
              >
                {t("arabic")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("money")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rate">{t("defaultHourlyRate")}</Label>
            <Input
              id="rate"
              type="number"
              min="0"
              step="0.01"
              value={value.defaultHourlyRate}
              onChange={(e) => update("defaultHourlyRate", num(e.target.value, 0))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">{t("currencySymbol")}</Label>
            <Input
              id="currency"
              value={value.currency}
              maxLength={4}
              onChange={(e) => update("currency", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("timerDurations")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("focus")}
            id="focus"
            value={value.focusMin}
            onChange={(v) => update("focusMin", v)}
          />
          <Field
            label={t("shortBreak")}
            id="short"
            value={value.shortBreakMin}
            onChange={(v) => update("shortBreakMin", v)}
          />
          <Field
            label={t("longBreak")}
            id="long"
            value={value.longBreakMin}
            onChange={(v) => update("longBreakMin", v)}
          />
          <Field
            label={t("longBreakEvery")}
            id="every"
            value={value.longBreakEvery}
            onChange={(v) => update("longBreakEvery", Math.max(1, v))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm sm:text-base">{t("soundOnCompletion")}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">{t("playChime")}</div>
          </div>
          <Switch checked={value.soundOn} onCheckedChange={(v) => update("soundOn", v)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("youtubeNoise")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm sm:text-base">{t("youtubeOnlyWhenRunning")}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{t("youtubeOnlyWhenRunningDesc")}</div>
            </div>
            <Switch
              checked={value.youtubeOnlyWhenRunning}
              onCheckedChange={(v) => update("youtubeOnlyWhenRunning", v)}
            />
          </div>

          <div className="space-y-2 pt-4 border-t border-border">
            <Label>{t("youtubeVolumeLabel", { volume: value.youtubeVolume })}</Label>
            <div className="flex items-center gap-4">
              <Slider
                min={0}
                max={100}
                step={1}
                value={[value.youtubeVolume]}
                onValueChange={(val) => update("youtubeVolume", val[0])}
                className="flex-1"
              />
              <span className="text-sm font-mono text-muted-foreground w-12 text-end tabular-nums">
                {value.youtubeVolume}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            reset();
            toast.success(t("settingsReset"));
          }}
        >
          {t("resetDefaults")}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min="1"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) && n > 0 ? n : 1);
        }}
      />
    </div>
  );
}

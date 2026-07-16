import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { DEFAULT_SETTINGS, KEYS, Settings } from "@/lib/store";

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
  const { value, setValue, hydrated, reset } = useLocalStorage<Settings>(KEYS.settings, DEFAULT_SETTINGS);

  if (!hydrated) return <div className="text-muted-foreground text-sm">Loading…</div>;

  const update = <K extends keyof Settings>(key: K, v: Settings[K]) =>
    setValue({ ...value, [key]: v });

  const num = (v: string, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Money</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rate">Default hourly rate</Label>
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
            <Label htmlFor="currency">Currency symbol</Label>
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
          <CardTitle>Timer durations (minutes)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Focus" id="focus" value={value.focusMin} onChange={(v) => update("focusMin", v)} />
          <Field label="Short break" id="short" value={value.shortBreakMin} onChange={(v) => update("shortBreakMin", v)} />
          <Field label="Long break" id="long" value={value.longBreakMin} onChange={(v) => update("longBreakMin", v)} />
          <Field
            label="Long break every N pomodoros"
            id="every"
            value={value.longBreakEvery}
            onChange={(v) => update("longBreakEvery", Math.max(1, v))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <div className="font-medium">Sound on completion</div>
            <div className="text-sm text-muted-foreground">Play a chime when a session ends.</div>
          </div>
          <Switch checked={value.soundOn} onCheckedChange={(v) => update("soundOn", v)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback & Bug Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="web3FormsKey">Web3Forms Access Key</Label>
            <Input
              id="web3FormsKey"
              placeholder="e.g. 12345678-abcd-1234-abcd-1234567890ab"
              value={value.web3FormsKey || ""}
              onChange={(e) => update("web3FormsKey", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              To receive user feedback directly in your email inbox behind the scenes, get a free Access Key from{" "}
              <a
                href="https://web3forms.com"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-medium"
              >
                web3forms.com
              </a>{" "}
              (takes 10 seconds, no password or sign-up required).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            reset();
            toast.success("Settings reset to defaults");
          }}
        >
          Reset to defaults
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
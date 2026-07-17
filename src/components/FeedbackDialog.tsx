import { useState } from "react";
import { MessageSquarePlus, AlertCircle, Sparkles, Loader2, Send, Github } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "../lib/translations";

// ============================================================================
// DEVELOPER CONFIGURATION:
// Get your free Web3Forms Access Key from https://web3forms.com/
// Paste it below to receive feedback from your users directly to your email inbox!
// ============================================================================
const WEB3FORMS_ACCESS_KEY = (import.meta.env.VITE_WEB3FORMS_KEY || "").trim();
const GITHUB_REPO_URL = "https://github.com/osaamaahmeed/focus_and_earn";

export function FeedbackDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"bug" | "suggestion">("bug");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getFormattedFeedback = () => {
    return `### Type\n${type === "bug" ? "Bug Report" : "Suggestion"}\n\n### Description\n${description.trim()}\n\n---\n*Submitted via Focus & Earn Feedback Tool*`;
  };

  const handleSubmitToGithub = () => {
    if (description.trim() === "") {
      toast.error(t("rateError"));
      return;
    }
    const title = encodeURIComponent(
      `${type === "bug" ? "Bug" : "Suggestion"}: ${description.slice(0, 50)}${description.length > 50 ? "..." : ""}`,
    );
    const body = encodeURIComponent(getFormattedFeedback());
    const githubUrl = `${GITHUB_REPO_URL}/issues/new?title=${title}&body=${body}`;
    window.open(githubUrl, "_blank", "noopener,noreferrer");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim() === "") {
      toast.error(t("rateError"));
      return;
    }

    if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === "YOUR_ACCESS_KEY_HERE") {
      toast.error("Feedback key is not configured by the developer. Please copy details instead.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Feedback [${type.toUpperCase()}]: ${description.slice(0, 45)}...`,
          from_name: "Focus & Earn User",
          message: description.trim(),
          type: type,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(t("feedbackSuccess"));
        setDescription("");
        setOpen(false);
      } else {
        toast.error(data.message || t("feedbackError"));
      }
    } catch (error) {
      toast.error(t("feedbackError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all shrink-0 font-medium"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("feedback")}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] w-full p-6 bg-background border border-border rounded-lg shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <MessageSquarePlus className="h-4 w-4 text-primary" />
              <span>{t("feedbackTitle")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">{t("feedbackSubtitle")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("feedbackType")}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("bug")}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border text-xs font-medium transition-all ${
                    type === "bug"
                      ? "border-destructive bg-destructive/10 text-destructive font-semibold shadow-sm"
                      : "border-border bg-background hover:bg-accent text-muted-foreground"
                  }`}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  {t("bugReport")}
                </button>
                <button
                  type="button"
                  onClick={() => setType("suggestion")}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border text-xs font-medium transition-all ${
                    type === "suggestion"
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                      : "border-border bg-background hover:bg-accent text-muted-foreground"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("suggestion")}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-xs font-semibold text-muted-foreground">
                {t("description")}
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === "bug"
                    ? t("descriptionBugPlaceholder")
                    : t("descriptionSuggestionPlaceholder")
                }
                className="h-[100px] text-sm resize-none"
              />
            </div>

            {!WEB3FORMS_ACCESS_KEY && (
              <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2 text-[11px] text-yellow-600 dark:text-yellow-400">
                <p>
                  <strong>Developer Notice:</strong> Set the <code>VITE_WEB3FORMS_KEY</code>{" "}
                  environment variable in your local <code>.env</code> file to enable silent
                  background submissions.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-between pt-3 border-t border-border mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSubmitToGithub}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" />
              <span>{t("submitOnGithub")}</span>
            </Button>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setDescription("");
                  setOpen(false);
                }}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!WEB3FORMS_ACCESS_KEY || submitting}
                className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>{t("sendFeedback")}</span>
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

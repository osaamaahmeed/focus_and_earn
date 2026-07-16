import { useState } from "react";
import { MessageSquarePlus, AlertCircle, Sparkles, Copy, Check, Loader2, Send } from "lucide-react";
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
import { useLocalStorage } from "@/hooks/use-local-storage";
import { DEFAULT_SETTINGS, KEYS, Settings } from "@/lib/store";

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"bug" | "suggestion">("bug");
  const [description, setDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { value: settings } = useLocalStorage<Settings>(KEYS.settings, DEFAULT_SETTINGS);
  const web3FormsKey = settings?.web3FormsKey?.trim() || "";

  const getFormattedFeedback = () => {
    return `### Type\n${type === "bug" ? "Bug Report" : "Suggestion"}\n\n### Description\n${description.trim()}\n\n---\n*Submitted via Focus & Earn Feedback Tool*`;
  };

  const handleCopy = async () => {
    if (description.trim() === "") {
      toast.error("Please provide a description");
      return;
    }
    try {
      await navigator.clipboard.writeText(getFormattedFeedback());
      setCopied(true);
      toast.success("Feedback details copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy text. Please select and copy manually.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim() === "") {
      toast.error("Please provide a description");
      return;
    }

    if (!web3FormsKey) {
      toast.error("Feedback key is not configured. Please see Settings.");
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
          access_key: web3FormsKey,
          subject: `Feedback [${type.toUpperCase()}]: ${description.slice(0, 40)}...`,
          from_name: "Focus & Earn Application",
          message: description.trim(),
          type: type,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Feedback sent successfully!");
        setDescription("");
        setOpen(false);
      } else {
        toast.error(data.message || "Failed to send feedback. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred while sending feedback. Try copying details instead.");
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
          <span className="hidden sm:inline">Feedback</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] w-full p-5 bg-background border border-border rounded-lg shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <MessageSquarePlus className="h-4 w-4 text-primary" />
              <span>Feedback & Bugs</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Help us improve. Submit a bug report or a suggestion directly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Feedback Type</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("bug")}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
                    type === "bug"
                      ? "border-destructive bg-destructive/10 text-destructive font-semibold shadow-sm"
                      : "border-border bg-background hover:bg-accent text-muted-foreground"
                  }`}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  Bug Report
                </button>
                <button
                  type="button"
                  onClick={() => setType("suggestion")}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
                    type === "suggestion"
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                      : "border-border bg-background hover:bg-accent text-muted-foreground"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggestion
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-xs font-semibold text-muted-foreground">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === "bug"
                    ? "Describe the bug you encountered, and how to reproduce it..."
                    : "Tell us about your suggestion or what feature you'd like to see..."
                }
                className="h-[80px] min-h-[80px] max-h-[140px] text-sm resize-y"
              />
            </div>

            {!web3FormsKey && (
              <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2.5 text-xs text-yellow-600 dark:text-yellow-400">
                <p>
                  <strong>Note:</strong> Web3Forms key is not configured in Settings. Only clipboard copying is available.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-between pt-3 border-t border-border mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 w-full sm:w-auto text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>Copy Details</span>
            </Button>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
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
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!web3FormsKey || submitting}
                className="gap-1.5 w-full sm:w-auto text-xs bg-primary text-primary-foreground font-semibold"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Send Feedback</span>
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

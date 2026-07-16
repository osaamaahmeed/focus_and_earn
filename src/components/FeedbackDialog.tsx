import { useState } from "react";
import { MessageSquarePlus, AlertCircle, Sparkles, Github, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"bug" | "suggestion">("bug");
  const [description, setDescription] = useState("");
  const [copied, setCopied] = useState(false);

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

  const handleGithubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim() === "") {
      toast.error("Please provide a description");
      return;
    }

    const trimmedDesc = description.trim();
    const firstLine = trimmedDesc.split("\n")[0].slice(0, 50);
    const issueTitle = `[${type.toUpperCase()}] ${firstLine}${trimmedDesc.length > 50 ? "..." : ""}`;

    const repoUrl = "https://github.com/osaamaahmeed/time-is-money-todo/issues/new";
    const titleParam = encodeURIComponent(issueTitle);
    const bodyParam = encodeURIComponent(getFormattedFeedback());
    const labelParam = type === "bug" ? "bug" : "enhancement";

    const url = `${repoUrl}?title=${titleParam}&body=${bodyParam}&labels=${labelParam}`;
    window.open(url, "_blank");

    setDescription("");
    setOpen(false);
    toast.success("Opening GitHub Issues in a new tab...");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all duration-300 animate-pulse-subtle"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span>Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleGithubSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-primary" />
              <span>Feedback & Bugs</span>
            </DialogTitle>
            <DialogDescription>
              Help us improve. Submit a bug report or a suggestion directly to our GitHub repository.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Feedback Type</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("bug")}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    type === "bug"
                      ? "border-destructive bg-destructive/10 text-destructive font-semibold shadow-sm"
                      : "border-border bg-background hover:bg-accent text-muted-foreground"
                  }`}
                >
                  <AlertCircle className="h-4 w-4" />
                  Bug Report
                </button>
                <button
                  type="button"
                  onClick={() => setType("suggestion")}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    type === "suggestion"
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                      : "border-border bg-background hover:bg-accent text-muted-foreground"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Suggestion
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-sm font-medium">
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
                className="min-h-[120px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="gap-2 self-stretch sm:self-auto"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>Copy Details</span>
            </Button>
            <div className="flex gap-2 self-stretch sm:self-auto justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDescription("");
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <Github className="h-4 w-4" />
                <span>Submit on GitHub</span>
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

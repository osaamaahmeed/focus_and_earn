import { useState } from "react";
import { MessageSquarePlus, AlertCircle, Sparkles, Github, Copy, Check, Mail } from "lucide-react";
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

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"bug" | "suggestion">("bug");
  const [description, setDescription] = useState("");
  const [copied, setCopied] = useState(false);

  const developerEmail = "osaamaahmeed@gmail.com";

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

  const handleAction = (method: "github" | "gmail") => {
    if (description.trim() === "") {
      toast.error("Please provide a description");
      return;
    }

    const trimmedDesc = description.trim();
    const firstLine = trimmedDesc.split("\n")[0].slice(0, 50);
    const issueTitle = `[${type.toUpperCase()}] ${firstLine}${trimmedDesc.length > 50 ? "..." : ""}`;

    if (method === "github") {
      const repoUrl = "https://github.com/osaamaahmeed/time-is-money-todo/issues/new";
      const titleParam = encodeURIComponent(issueTitle);
      const bodyParam = encodeURIComponent(getFormattedFeedback());
      const labelParam = type === "bug" ? "bug" : "enhancement";

      const url = `${repoUrl}?title=${titleParam}&body=${bodyParam}&labels=${labelParam}`;
      window.open(url, "_blank");
      toast.success("Opening GitHub Issues...");
    } else {
      const subjectParam = encodeURIComponent(issueTitle);
      const bodyParam = encodeURIComponent(getFormattedFeedback());
      
      // Open Gmail Web Compose directly in the browser to avoid desktop client popups (like Outlook)
      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${developerEmail}&su=${subjectParam}&body=${bodyParam}`;
      window.open(url, "_blank");
      toast.success("Opening Gmail in a new tab...");
    }

    setDescription("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all shrink-0"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="hidden sm:inline">Feedback</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto p-6 bg-background border border-border rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary" />
            <span>Feedback & Bugs</span>
          </DialogTitle>
          <DialogDescription>
            Help us improve. Submit a bug report or a suggestion using one of the web channels below.
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

        {/* Custom footer actions to prevent Shadcn DialogFooter style conflicts */}
        <div className="flex flex-col gap-2 sm:flex-row justify-between pt-4 border-t border-border mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="gap-2 w-full sm:w-auto"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>Copy Details</span>
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
            <Button 
              type="button"
              variant="outline"
              onClick={() => handleAction("gmail")}
              className="gap-2 w-full sm:w-auto"
            >
              <Mail className="h-4 w-4" />
              <span>Send via Gmail</span>
            </Button>
            <Button 
              type="button"
              onClick={() => handleAction("github")} 
              className="gap-2 w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 font-medium"
            >
              <Github className="h-4 w-4" />
              <span>Submit on GitHub</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

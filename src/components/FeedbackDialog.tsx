import { useState } from "react";
import { MessageSquarePlus, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { KEYS, Feedback, uid } from "@/lib/store";
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
  const { value: feedbacks, setValue: setFeedbacks } = useLocalStorage<Feedback[]>(
    KEYS.feedback,
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim() === "") {
      toast.error("Please provide a description");
      return;
    }

    const item: Feedback = {
      id: uid(),
      type,
      description: description.trim(),
      createdAt: Date.now(),
    };

    setFeedbacks([item, ...feedbacks]);
    setDescription("");
    setOpen(false);
    toast.success("Thank you! Your feedback has been recorded.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all duration-300"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span>Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-primary" />
              <span>Feedback & Bugs</span>
            </DialogTitle>
            <DialogDescription>
              Help us improve. Submit a bug report or a feature suggestion.
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

          <DialogFooter>
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
            <Button type="submit">Submit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

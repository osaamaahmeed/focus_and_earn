import { Link } from "@tanstack/react-router";
import { Timer } from "lucide-react";

export function SiteHeader() {
  const linkClass =
    "text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md";
  const activeClass = "text-foreground font-medium bg-accent";
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Timer className="h-5 w-5 text-primary" />
          <span>Focus & Earn</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/" className={linkClass} activeOptions={{ exact: true }} activeProps={{ className: `${linkClass} ${activeClass}` }}>
            Timer
          </Link>
          <Link to="/stats" className={linkClass} activeProps={{ className: `${linkClass} ${activeClass}` }}>
            Stats
          </Link>
          <Link to="/settings" className={linkClass} activeProps={{ className: `${linkClass} ${activeClass}` }}>
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}
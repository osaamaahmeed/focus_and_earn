import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "../components/SiteHeader";
import { Toaster } from "../components/ui/sonner";
import { useLocalStorage } from "../hooks/use-local-storage";
import { KEYS, DEFAULT_SETTINGS, Settings } from "../lib/store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Focus & Earn — Pomodoro Timer with Earnings" },
      {
        name: "description",
        content:
          "A Pomodoro timer and to-do list that tracks both your focused time and how much money you've earned per session.",
      },
      { property: "og:title", content: "Focus & Earn — Pomodoro Timer with Earnings" },
      {
        property: "og:description",
        content:
          "A Pomodoro timer and to-do list that tracks both your focused time and how much money you've earned per session.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Focus & Earn — Pomodoro Timer with Earnings" },
      {
        name: "twitter:description",
        content:
          "A Pomodoro timer and to-do list that tracks both your focused time and how much money you've earned per session.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e2b6b63f-dac2-4e9f-830d-05d81366db4c/id-preview-168c038f--376eb0cd-c0d1-47b5-8f13-363e7868759f.lovable.app-1784232524475.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e2b6b63f-dac2-4e9f-830d-05d81366db4c/id-preview-168c038f--376eb0cd-c0d1-47b5-8f13-363e7868759f.lovable.app-1784232524475.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "./logo.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { value: settings, hydrated } = useLocalStorage<Settings>(KEYS.settings, DEFAULT_SETTINGS);
  const ytPlayerRef = useRef<HTMLIFrameElement>(null);
  const FOCUS_NOISE_VIDEO_ID = "yLOM8R6lbzg";

  useEffect(() => {
    if (!hydrated) return;
    const htmlEl = document.documentElement;

    // Apply theme class
    if (settings.theme === "dark") {
      htmlEl.classList.add("dark");
    } else {
      htmlEl.classList.remove("dark");
    }

    // Apply language and text direction
    htmlEl.lang = settings.lang || "en";
    htmlEl.dir = "ltr"; // Keep scrollbars static on the right to prevent page resizing shift
  }, [settings.theme, settings.lang, hydrated]);

  // Listen to control-white-noise event from child routes
  useEffect(() => {
    const handleControl = (e: Event) => {
      const customEvent = e as CustomEvent<{ command: string; volume: number }>;
      const iframe = ytPlayerRef.current;
      if (!iframe) return;
      try {
        if (customEvent.detail.command === "playVideo") {
          iframe.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "unMute", args: "" }),
            "*"
          );
        }
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: customEvent.detail.command, args: "" }),
          "*"
        );
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [customEvent.detail.volume] }),
          "*"
        );
      } catch (err) {
        console.error("Failed to post message to global YouTube player", err);
      }
    };

    window.addEventListener("control-white-noise", handleControl);
    return () => window.removeEventListener("control-white-noise", handleControl);
  }, []);

  // Sync settings when loaded/modified directly
  useEffect(() => {
    if (!hydrated) return;
    const iframe = ytPlayerRef.current;
    if (!iframe) return;

    const shouldPlay = settings.youtubeNoiseOn && !settings.youtubeOnlyWhenRunning;
    const command = shouldPlay ? "playVideo" : "pauseVideo";

    const timeoutId = setTimeout(() => {
      try {
        if (shouldPlay) {
          iframe.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "unMute", args: "" }),
            "*"
          );
        }
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: command, args: "" }),
          "*"
        );
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [settings.youtubeVolume] }),
          "*"
        );
      } catch {}
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [hydrated, settings.youtubeNoiseOn, settings.youtubeOnlyWhenRunning, settings.youtubeVolume]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground" dir="ltr">
        <SiteHeader />
        <main
          className="mx-auto max-w-5xl px-4 py-8"
          dir={hydrated && settings.lang === "ar" ? "rtl" : "ltr"}
        >
          {/* Required: nested routes render here. */}
          <Outlet />
        </main>
      </div>
      <iframe
        ref={ytPlayerRef}
        width="0"
        height="0"
        src={`https://www.youtube.com/embed/${FOCUS_NOISE_VIDEO_ID}?enablejsapi=1&controls=0&loop=1&playlist=${FOCUS_NOISE_VIDEO_ID}&autoplay=0&mute=0`}
        title="White Noise Player"
        className="hidden pointer-events-none absolute w-0 h-0"
        allow="autoplay"
      />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

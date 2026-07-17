import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    base: "/focus_and_earn/",
  },
  tanstackStart: {
    spa: {
      enabled: true,
    },
  },
  nitro: false,
});

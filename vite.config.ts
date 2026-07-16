import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    base: "/time-is-money-todo/",
  },
  tanstackStart: {
    spa: {
      enabled: true,
    },
  },
  nitro: false,
});

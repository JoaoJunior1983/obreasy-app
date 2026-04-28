import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "https://www.obreasy.com.br";
const IS_LOCAL = BASE_URL.includes("localhost") || BASE_URL.includes("127.0.0.1");

export default defineConfig({
  testDir: "./tests/perf/journeys",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: "perf/reports/last-run.json" }],
  ],
  use: {
    baseURL: BASE_URL,
    headless: true,
    launchOptions: {
      args: ["--remote-debugging-port=9222"],
    },
  },
  projects: [
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: IS_LOCAL
    ? {
        command: "npm run start",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});

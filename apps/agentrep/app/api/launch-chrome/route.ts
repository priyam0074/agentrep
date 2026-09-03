import { spawn } from "child_process";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const runtime = "nodejs";

const CHROMES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];

/** Dev-only: open a dedicated Chrome profile with the WebMCP testing flag. */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { ok: false, error: "Only available while running pnpm dev." },
      { status: 403 },
    );
  }

  const chrome = CHROMES.find((p) => existsSync(p));
  if (!chrome) {
    return Response.json(
      { ok: false, error: "Google Chrome is not installed in /Applications." },
      { status: 404 },
    );
  }

  const profile = join(homedir(), ".agentrep-chrome-webmcp");
  spawn(
    chrome,
    [
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--enable-webmcp-testing",
      "--enable-features=WebMCP,WebMCPTesting",
      "http://localhost:3000",
    ],
    { detached: true, stdio: "ignore" },
  ).unref();

  return Response.json({ ok: true });
}

"use client";

/**
 * @agentrep/webmcp — React binding
 * ------------------------------------------------------------------
 * Split out from index.ts because this half touches document/useEffect
 * and must stay client-only; the rest (paise, toolOk, types) is plain
 * data plumbing that server components import too.
 */

import { useEffect, useRef } from "react";
import type { ToolDefinition } from "./index";

interface ModelContext {
  registerTool: (tool: ToolDefinition) => void | (() => void);
  unregisterTool?: (name: string) => void;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

export function isWebMCPAvailable(): boolean {
  return typeof document !== "undefined" && !!document.modelContext;
}

/**
 * Register tools and return a disposer. Some builds return an
 * unregister function from registerTool, others expose
 * unregisterTool; we handle both and no-op if neither exists.
 */
export function registerTools(tools: ToolDefinition[]): () => void {
  if (!isWebMCPAvailable()) return () => {};
  const mc = document.modelContext!;
  const disposers: Array<() => void> = [];

  for (const tool of tools) {
    try {
      const maybeDisposer = mc.registerTool(tool);
      if (typeof maybeDisposer === "function") {
        disposers.push(maybeDisposer);
      } else if (typeof mc.unregisterTool === "function") {
        disposers.push(() => mc.unregisterTool!(tool.name));
      }
    } catch (e) {
      console.warn(`[webmcp] failed to register "${tool.name}"`, e);
    }
  }

  return () => disposers.forEach((d) => { try { d(); } catch {} });
}

/**
 * React binding. `build` is re-read on every render but tools are only
 * re-registered when `deps` change, so tool closures always see fresh
 * state without churning the registration on every keystroke.
 */
export function useWebMCPTools(
  build: () => ToolDefinition[],
  deps: unknown[] = [],
): void {
  const buildRef = useRef(build);
  buildRef.current = build;

  useEffect(() => {
    const defs = buildRef.current();
    // Re-wrap execute so it always calls through the latest closure.
    const live = defs.map((d) => ({
      ...d,
      execute: (input: any) => {
        const current = buildRef.current().find((t) => t.name === d.name);
        return (current ?? d).execute(input);
      },
    }));
    return registerTools(live);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

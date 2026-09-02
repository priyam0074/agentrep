/**
 * @agentrep/webmcp
 * ------------------------------------------------------------------
 * Thin wrapper over the WebMCP browser API (document.modelContext).
 *
 * The spec is young and only ships behind a flag / origin trial, so
 * everything here degrades quietly: on a browser without WebMCP the
 * site still works for humans, tools simply never register.
 */

import { useEffect, useRef } from "react";

// ── Spec surface ───────────────────────────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: any) => Promise<unknown> | unknown;
}

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

// ── Response envelope ──────────────────────────────────────────────
//
// Every tool returns this shape. Errors are returned, never thrown:
// a thrown error gives the agent nothing to recover from, while a
// `recovery` string tells it exactly what to try next.

export interface ToolOk<T> {
  ok: true;
  summary: string;
  data: T;
  [extra: string]: unknown;
}

export interface ToolErr {
  ok: false;
  code: string;
  message: string;
  recovery?: string;
}

export const toolOk = <T,>(
  data: T,
  summary: string,
  extra: Record<string, unknown> = {},
): ToolOk<T> => ({ ok: true, summary, data, ...extra });

export const toolErr = (
  code: string,
  message: string,
  recovery?: string,
): ToolErr => ({ ok: false, code, message, recovery });

// ── Money ──────────────────────────────────────────────────────────
//
// Integer paise everywhere. Floats in a budget demo will embarrass you
// live, and the agent handles integers far more reliably.

export const paise = (rupees: number) => Math.round(rupees * 100);

export const formatINR = (p: number) =>
  "\u20B9" + Math.round(p / 100).toLocaleString("en-IN");

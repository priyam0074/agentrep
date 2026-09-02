/**
 * @agentrep/webmcp
 * ------------------------------------------------------------------
 * Thin wrapper over the WebMCP browser API (document.modelContext).
 *
 * The spec is young and only ships behind a flag / origin trial, so
 * everything here degrades quietly: on a browser without WebMCP the
 * site still works for humans, tools simply never register.
 *
 * This file stays server-safe (no "use client") so provider configs
 * can import `paise`/types from a Server Component; the React binding
 * lives in ./react and is re-exported below.
 */

// ── Spec surface ───────────────────────────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: any) => Promise<unknown> | unknown;
}

export { isWebMCPAvailable, registerTools, useWebMCPTools } from "./react";

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
  "₹" + Math.round(p / 100).toLocaleString("en-IN");

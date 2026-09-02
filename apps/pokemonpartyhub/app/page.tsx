"use client";

import { ProviderShell } from "@agentrep/provider-kit";
import { config } from "@/lib/provider";

export default function Page() {
  return <ProviderShell config={config} />;
}

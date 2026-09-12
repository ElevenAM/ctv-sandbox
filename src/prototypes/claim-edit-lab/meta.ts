import type { PrototypeMeta } from "@/prototypes/types";

export const meta: PrototypeMeta = {
  slug: "claim-edit-lab",
  index: "EX-03",
  title: "Claim Edit Lab",
  // One line, sentence case, no trailing period. This is the gallery copy.
  tagline:
    "Write a claim-edit rule and see what it flags, and saves, instantly",
  // Two or three sentences. What it proves, and why it is worth opening.
  summary:
    "A policy analyst authors an edit rule as a sentence of drop-downs and watches a synthetic sample of 150 claim lines respond on every change: which lines it flags, why, and the gross dollars it would have saved. Replaces the spreadsheet emailed to engineering.",
  status: "live",
  tone: "jade",
  tags: ["claims", "rules", "payment-integrity"],
  updated: "2026-09-12",
  // Add 'supabase' | 'anon-auth' | 'realtime' if this needs the database.
  capabilities: [],
  brief: "docs/prototypes/claim-edit-lab.md",
};

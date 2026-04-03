// src/utils/search.ts
import {
  getTerm,
  searchTerms as sdkSearch,
  allTerms,
} from "@stbr/solana-glossary";
import type { GlossaryTerm } from "@stbr/solana-glossary";

export type LookupResult =
  | { type: "found"; term: GlossaryTerm }
  | { type: "multiple"; terms: GlossaryTerm[] }
  | { type: "not-found" };

export function lookupTerm(input: string): LookupResult {
  const trimmed = input.trim();
  if (!trimmed) return { type: "not-found" };

  // Try exact lookup by ID or alias first (case-insensitive via SDK)
  const exact = getTerm(trimmed);
  if (exact) return { type: "found", term: exact };

  // Fall back to full-text search
  const results = sdkSearch(trimmed);
  if (results.length === 0) return { type: "not-found" };
  if (results.length === 1) return { type: "found", term: results[0] };
  return { type: "multiple", terms: results.slice(0, 5) };
}

/** Returns n random terms from the full glossary */
export function getRandomTerms(n: number): GlossaryTerm[] {
  const shuffled = [...allTerms].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

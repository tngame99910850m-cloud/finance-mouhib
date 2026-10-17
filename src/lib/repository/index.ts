import type { OutfitRepository } from "./types";
import { IndexedDbOutfitRepository } from "./indexeddb-repository";
import { MemoryOutfitRepository } from "./memory-repository";

export type { OutfitRepository } from "./types";

/**
 * Repository selection. Local-first by design:
 *
 * - In the browser, IndexedDB is the default and only required store —
 *   the app must work fully with no network access and no cloud
 *   credentials ("local-only mode").
 * - On the server (SSR) or in tests, an in-memory store stands in since
 *   IndexedDB doesn't exist there.
 *
 * To add optional Supabase sync later: implement `OutfitRepository`
 * against the Supabase client (see docs/3d-asset-pipeline.md for the
 * asset side of that), then wrap both repositories in a small
 * "dual-write, local-read-first" adapter here. Until `NEXT_PUBLIC_
 * SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are both set, the
 * app must keep working exactly as it does today — never block on the
 * network, and never put a service-role key in browser code.
 */
let repository: OutfitRepository | null = null;

export function getRepository(): OutfitRepository {
  if (repository) return repository;
  repository = typeof window === "undefined" ? new MemoryOutfitRepository() : new IndexedDbOutfitRepository();
  return repository;
}

/** Test-only hook to inject a fresh in-memory repository. */
export function __setTestRepository(repo: OutfitRepository) {
  repository = repo;
}

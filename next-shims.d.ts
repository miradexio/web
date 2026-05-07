// Workaround for a known Next.js 16.1.6 + pnpm peer-deps mismatch.
//
// Next ships shim `.d.ts` files at the package root (e.g. `next/types.d.ts`,
// `next/navigation.d.ts`, `next/font/google/index.d.ts`) that re-export from
// a hard-coded `.pnpm/next@16.1.6_@babel+core@7.29.0_...` path. That path is
// only valid when pnpm resolves Next with the exact peer-dep set Next was
// published against. In a monorepo with different peer-deps (e.g. another
// package pulls `@playwright/test`), pnpm assigns Next a different hash and
// the re-export targets a non-existent directory — so subpath imports like
// `import type { Metadata } from "next"` fail to compile even though the
// real type files DO exist under `next/dist/...`.
//
// Until Next ships fixed shims (or we switch to a pnpm config that pins the
// peer-dep set), declare the broken modules here pointing at the real
// dist files. Only the subpath imports we actually use need to be covered.

declare module "next" {
  export type { Metadata } from "next/dist/lib/metadata/types/metadata-interface.js";
  export type { NextConfig } from "next/dist/server/config-shared.js";
}

declare module "next/types" {
  export type { Metadata } from "next/dist/lib/metadata/types/metadata-interface.js";
  export type { NextConfig } from "next/dist/server/config-shared.js";
}

declare module "next/navigation" {
  export * from "next/dist/client/components/navigation.js";
}

declare module "next/navigation.js" {
  export * from "next/dist/client/components/navigation.js";
}

declare module "next/font/google" {
  export * from "next/dist/compiled/@next/font/dist/google/index.js";
}

declare module "next/font/google/index.js" {
  export * from "next/dist/compiled/@next/font/dist/google/index.js";
}

// Same pnpm-shim mismatch hits Vitest 2.1.9 — its `vitest/config.d.ts`
// re-exports through a phantom `.pnpm/vitest@2.1.9_...` path. The runtime
// `defineConfig` is a thin pass-through (returns its argument), so a minimal
// type stub is enough; we never call it in production code, only at config
// time. Strict typing of vitest options isn't worth pulling more shims in.
declare module "vitest/config" {
  export const defineConfig: <T>(config: T) => T;
  export const defineProject: <T>(config: T) => T;
  export const defineWorkspace: <T>(config: T) => T;
  export const mergeConfig: <A, B>(a: A, b: B) => A & B;
}

declare module "vitest/config.js" {
  export const defineConfig: <T>(config: T) => T;
  export const defineProject: <T>(config: T) => T;
  export const defineWorkspace: <T>(config: T) => T;
  export const mergeConfig: <A, B>(a: A, b: B) => A & B;
}

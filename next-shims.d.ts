
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

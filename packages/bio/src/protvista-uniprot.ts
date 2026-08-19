// Untyped ambient module — nothing here calls its API directly, only its
// self-registered custom element. Plain .ts, not .d.ts — Bun can't resolve a
// .d.ts-only import at runtime, though tsc alone would be fine with it.
declare module 'protvista-uniprot';

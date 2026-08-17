// `protvista-uniprot` ships no usable types under its package.json "exports"
// map (see check-types' TS7016 without this) — nothing here calls into its
// API directly (protvista.ts only relies on its self-registered
// `<protvista-uniprot>` custom element), so an untyped ambient module is
// enough, unlike 3dmol.ts/locuszoom.ts's fuller type shims.
//
// Plain .ts, not .d.ts — a bare `import './protvista-uniprot';` (see
// protvista.ts) doesn't resolve to a .d.ts file under Bun's runtime module
// resolution (confirmed: `Cannot find module` with a .d.ts-only file at this
// path), even though it works fine for TypeScript's own compiler. Matches
// 3dmol.ts/locuszoom.ts's existing convention for the same reason.
declare module 'protvista-uniprot';

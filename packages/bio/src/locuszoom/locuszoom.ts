// `locuszoom` ships no types (no @types/locuszoom package exists). This covers
// only the surface this package actually calls.
declare module 'locuszoom' {
	interface LocusZoomDataSources {
		add(name: string, config: [string, Record<string, unknown>]): LocusZoomDataSources;
	}

	interface LocusZoomLayouts {
		get(type: string, name: string, overrides?: Record<string, unknown>): Record<string, unknown>;
	}

	interface LocusZoomStatic {
		DataSources: new () => LocusZoomDataSources;
		Layouts: LocusZoomLayouts;
		populate(selector: string | Element, datasource: LocusZoomDataSources, layout: Record<string, unknown>): unknown;
		// Installs an ext plugin (see the locuszoom/esm/ext/* module declarations
		// below) — idempotent, safe to call more than once with the same plugin.
		use(plugin: (LocusZoom: LocusZoomStatic) => void): void;
	}

	const LocusZoom: LocusZoomStatic;
	export default LocusZoom;
}

declare module 'locuszoom/dist/locuszoom.css';

// Ext plugins each export an install(LocusZoom) function meant for
// LocusZoom.use(). Typed loosely — only enough surface for what this
// package actually imports.
declare module 'locuszoom/esm/ext/lz-intervals-track' {
	const install: (LocusZoom: unknown) => void;
	export default install;
}

declare module 'locuszoom/esm/ext/lz-credible-sets' {
	const install: (LocusZoom: unknown) => void;
	export default install;
}

declare module 'locuszoom/esm/ext/lz-tabix-source' {
	const install: (LocusZoom: unknown) => void;
	export default install;
}

declare module 'locuszoom/esm/ext/lz-parsers' {
	type LineParser = (line: string, index: number) => Record<string, unknown>;
	export function install(LocusZoom: unknown): void;
	export function makeGWASParser(config: Record<string, unknown>): LineParser;
	export function makeBed12Parser(config?: Record<string, unknown>): LineParser;
	export function makePlinkLdParser(config?: Record<string, unknown>): LineParser;
}

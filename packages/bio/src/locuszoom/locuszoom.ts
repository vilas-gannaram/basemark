// `locuszoom` ships no types (no @types/locuszoom package exists). This covers
// only the surface this package actually calls.
declare module 'locuszoom' {
	const LocusZoom: ILocusZoomStatic;
	export default LocusZoom;

	interface ILocusZoomDataSources {
		add(name: string, config: [string, Record<string, unknown>]): ILocusZoomDataSources;
	}

	interface ILocusZoomLayouts {
		get(type: string, name: string, overrides?: Record<string, unknown>): Record<string, unknown>;
	}

	interface IPlot {
		// Resizes the SVG to fit its container — populate() never calls this itself (see shared.ts).
		rescaleSVG(): void;
	}

	interface ILocusZoomStatic {
		DataSources: new () => ILocusZoomDataSources;
		Layouts: ILocusZoomLayouts;
		populate(selector: string | Element, datasource: ILocusZoomDataSources, layout: Record<string, unknown>): IPlot;
		// Installs an ext plugin (see the locuszoom/esm/ext/* module declarations
		// below) — idempotent, safe to call more than once with the same plugin.
		use(plugin: (LocusZoom: ILocusZoomStatic) => void): void;
	}
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
	export function install(LocusZoom: unknown): void;
	export function makeGWASParser(config: Record<string, unknown>): TLineParser;
	export function makeBed12Parser(config?: Record<string, unknown>): TLineParser;
	export function makePlinkLdParser(config?: Record<string, unknown>): TLineParser;
	type TLineParser = (line: string, index: number) => Record<string, unknown>;
}

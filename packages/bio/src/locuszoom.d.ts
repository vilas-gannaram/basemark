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
	}

	const LocusZoom: LocusZoomStatic;
	export default LocusZoom;
}

declare module 'locuszoom/dist/locuszoom.css';

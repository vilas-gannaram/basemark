// `3dmol` ships no types for its bundled ESM build (only for the source tree
// under build/types/, which doesn't map to this subpath). This covers only
// the surface this package actually calls.
declare module '3dmol/build/3Dmol.es6.js' {
	export function createViewer(element: Element, config?: IViewerConfig): IGLViewer | undefined;

	export function download(query: string, viewer: IGLViewer, options: Record<string, unknown>, callback: (model: unknown) => void): void;

	export interface IGLViewer {
		setStyle(sel: Record<string, unknown>, style: Record<string, unknown>): void;
		zoomTo(): void;
		render(): void;
	}

	export interface IViewerConfig {
		backgroundColor?: string;
	}
}

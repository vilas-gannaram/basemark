// `3dmol` ships no types for its bundled ESM build (only for the source tree
// under build/types/, which doesn't map to this subpath). This covers only
// the surface this package actually calls.
declare module '3dmol/build/3Dmol.es6.js' {
	export interface GLViewer {
		setStyle(sel: Record<string, unknown>, style: Record<string, unknown>): void;
		zoomTo(): void;
		render(): void;
	}

	export interface ViewerConfig {
		backgroundColor?: string;
	}

	export function createViewer(element: Element, config?: ViewerConfig): GLViewer | undefined;

	export function download(query: string, viewer: GLViewer, options: Record<string, unknown>, callback: (model: unknown) => void): void;
}

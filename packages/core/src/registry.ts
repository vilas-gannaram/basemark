export function validateProps(schema: Record<string, IPropSchema> | undefined, props: Record<string, unknown>): string[] {
	if (!schema) return [];
	const errors: string[] = [];
	for (const [key, propSchema] of Object.entries(schema)) {
		const value = props[key];
		if (value === undefined) {
			if (propSchema.required) errors.push(`missing required prop "${key}"`);
			continue;
		}
		if (typeof value !== propSchema.type) {
			errors.push(`prop "${key}" must be of type ${propSchema.type}, got ${typeof value}`);
		}
	}
	return errors;
}

export class ComponentRegistry {
	private entries = new Map<string, TComponentDefinition>();

	register(name: string, definition: TComponentDefinition, options?: IRegisterOptions): void {
		if (this.entries.has(name) && !options?.override) {
			throw new Error(`Component "${name}" is already registered. Pass { override: true } to replace it.`);
		}
		this.entries.set(name, definition);
	}

	resolve(name: string): TComponentDefinition | undefined {
		return this.entries.get(name);
	}

	list(): Array<[string, TComponentDefinition]> {
		return [...this.entries];
	}
}

export function createRegistry(): ComponentRegistry {
	return new ComponentRegistry();
}

export interface IPropSchema {
	type: 'string' | 'number' | 'boolean';
	required?: boolean;
	// What this prop means and how to fill it in — shown to AI authors via
	// generateSystemPrompt(), not just a type constraint.
	description?: string;
}

interface IComponentDefinitionBase {
	// Which pack this component belongs to (e.g. "bio", "chem", "common") —
	// lets generateSystemPrompt() scope its index to one domain instead of
	// the whole registry as more packs get built out.
	domain: string;
	// Human/AI-facing name and explanation of what the component renders and
	// when to use it — required so generateSystemPrompt() output is more than
	// a bare type signature.
	title: string;
	description: string;
	schema?: Record<string, IPropSchema>;
}

// The default: a customElements-registered tag (ARCHITECTURE.md §6), works
// across every consumption path (React, Svelte, plain HTML). `type` is
// omitted rather than `'web-component'` on every existing call site.
export interface IWebComponentDefinition extends IComponentDefinitionBase {
	type?: 'web-component';
	tag: string;
}

// The §6 escape hatch: app-local only, never for domain packs. `component`
// is untyped so core stays framework-free — the binding casts it back.
export interface INativeComponentDefinition extends IComponentDefinitionBase {
	type: 'react';
	component: unknown;
}

export type TComponentDefinition = IWebComponentDefinition | INativeComponentDefinition;

export interface IRegisterOptions {
	override?: boolean;
}

export interface PropSchema {
	type: 'string' | 'number' | 'boolean';
	required?: boolean;
	// What this prop means and how to fill it in — shown to AI authors via
	// generateSystemPrompt(), not just a type constraint.
	description?: string;
}

interface ComponentDefinitionBase {
	// Which pack this component belongs to (e.g. "bio", "chem", "common") —
	// lets generateSystemPrompt() scope its index to one domain instead of
	// the whole registry as more packs get built out.
	domain: string;
	// Human/AI-facing name and explanation of what the component renders and
	// when to use it — required so generateSystemPrompt() output is more than
	// a bare type signature.
	title: string;
	description: string;
	schema?: Record<string, PropSchema>;
}

// The default: a customElements-registered tag (ARCHITECTURE.md §6), works
// across every consumption path (React, Svelte, plain HTML). `type` is
// omitted rather than `'web-component'` on every existing call site.
export interface WebComponentDefinition extends ComponentDefinitionBase {
	type?: 'web-component';
	tag: string;
}

// The §6 escape hatch: app-local only, never for domain packs. `component`
// is untyped so core stays framework-free — the binding casts it back.
export interface NativeComponentDefinition extends ComponentDefinitionBase {
	type: 'react';
	component: unknown;
}

export type ComponentDefinition = WebComponentDefinition | NativeComponentDefinition;

export interface RegisterOptions {
	override?: boolean;
}

export function validateProps(schema: Record<string, PropSchema> | undefined, props: Record<string, unknown>): string[] {
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
	private entries = new Map<string, ComponentDefinition>();

	register(name: string, definition: ComponentDefinition, options?: RegisterOptions): void {
		if (this.entries.has(name) && !options?.override) {
			throw new Error(`Component "${name}" is already registered. Pass { override: true } to replace it.`);
		}
		this.entries.set(name, definition);
	}

	resolve(name: string): ComponentDefinition | undefined {
		return this.entries.get(name);
	}

	list(): Array<[string, ComponentDefinition]> {
		return [...this.entries];
	}
}

export function createRegistry(): ComponentRegistry {
	return new ComponentRegistry();
}

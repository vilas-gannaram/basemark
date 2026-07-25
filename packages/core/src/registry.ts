export interface PropSchema {
	type: 'string' | 'number' | 'boolean';
	required?: boolean;
}

export interface ComponentDefinition {
	tag: string;
	schema?: Record<string, PropSchema>;
}

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
			throw new Error(
				`Component "${name}" is already registered. Pass { override: true } to replace it.`
			);
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

export interface ComponentDefinition {
	tag: string;
}

export interface RegisterOptions {
	override?: boolean;
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
}

export function createRegistry(): ComponentRegistry {
	return new ComponentRegistry();
}

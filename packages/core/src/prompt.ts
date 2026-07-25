import type { ComponentDefinition, ComponentRegistry, PropSchema } from './registry';

export interface SystemPromptOptions {
	// Scope the index to one pack (e.g. "bio") instead of the whole registry —
	// keeps the always-on prompt small as more packs get registered.
	domain?: string;
}

function describeProp(name: string, schema: PropSchema): string {
	const requirement = schema.required ? 'required' : 'optional';
	const summary = `${name} (${schema.type}, ${requirement})`;
	return schema.description ? `  - ${summary}: ${schema.description}` : `  - ${summary}`;
}

// Full title + description + prop schema for one component. Call this only
// for the component(s) an author has actually picked, after reading the
// index from generateSystemPrompt() — keeps per-request cost proportional
// to what's used, not to how many components are registered.
export function describeComponent(registry: ComponentRegistry, name: string): string {
	const definition = registry.resolve(name);
	if (!definition) throw new Error(`Component "${name}" is not registered.`);

	const props = definition.schema
		? Object.entries(definition.schema)
				.map(([propName, propSchema]) => describeProp(propName, propSchema))
				.join('\n')
		: '  (no props)';

	return `## ${definition.title} (::${name})\n${definition.description}\n\n::${name}{...}\n${props}`;
}

function indexLine(name: string, definition: ComponentDefinition): string {
	return `::${name} — ${definition.title}`;
}

// Per ARCHITECTURE.md §5: derive the AI-facing prompt from the registry
// itself rather than hand-maintained docs. This is deliberately an index
// (name + title per component), not full descriptions for everything —
// pass `domain` to scope it to one pack, and call describeComponent() to
// fetch detail for whichever component gets picked.
export function generateSystemPrompt(registry: ComponentRegistry, options?: SystemPromptOptions): string {
	const components = registry.list().filter(([, definition]) => !options?.domain || definition.domain === options.domain);
	if (components.length === 0) return 'No components are registered.';

	const intro = [
		'You can embed components in markdown using leaf directive syntax: ::name{attr="value" ...}',
		'Below is an index of available components — only use ones listed here, do not invent new ones.',
		'Before writing a directive, look up its full prop details.',
	].join('\n');

	const index = components.map(([name, definition]) => indexLine(name, definition)).join('\n');

	return `${intro}\n\n${index}`;
}

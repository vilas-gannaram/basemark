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

// Full detail for one component, called only after generateSystemPrompt()'s
// index picks it — keeps per-request cost proportional to what's used.
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

// Derives the AI-facing prompt from the registry itself, not hand-maintained
// docs (ARCH §5). An index only — call describeComponent() for detail.
export function generateSystemPrompt(registry: ComponentRegistry, options?: SystemPromptOptions): string {
	const components = registry.list().filter(([, definition]) => !options?.domain || definition.domain === options.domain);
	if (components.length === 0) return 'No components are registered.';

	const intro = [
		'You can embed components in markdown using leaf directive syntax: ::name{attr="value" ...}',
		'Below is an index of available components — only use ones listed here, do not invent new ones.',
		'Before writing a directive, look up its full prop details.',
		'Gotcha: outside of a directive\'s own attributes, a bare "word:word" in prose (a genomic coordinate like ' +
			'chr10:114550452, a variant ID like 10:114758349_C/T, a timestamp) is misparsed as a directive and ' +
			'fails to render — wrap it in backticks instead.',
	].join('\n');

	const index = components.map(([name, definition]) => indexLine(name, definition)).join('\n');

	return `${intro}\n\n${index}`;
}

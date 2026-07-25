import type { ComponentDefinition, ComponentRegistry, PropSchema } from './registry';

function describeProp(name: string, schema: PropSchema): string {
	const requirement = schema.required ? 'required' : 'optional';
	const summary = `${name} (${schema.type}, ${requirement})`;
	return schema.description ? `  - ${summary}: ${schema.description}` : `  - ${summary}`;
}

function describeComponent(name: string, definition: ComponentDefinition): string {
	const props = definition.schema
		? Object.entries(definition.schema)
				.map(([propName, propSchema]) => describeProp(propName, propSchema))
				.join('\n')
		: '  (no props)';

	return `## ${definition.title} (::${name})\n${definition.description}\n\n::${name}{...}\n${props}`;
}

// Per ARCHITECTURE.md §5: derive the AI-facing component reference from the
// registry itself (component list + schemas) rather than hand-maintaining
// prompt docs that drift from what's actually registered.
export function generateSystemPrompt(registry: ComponentRegistry): string {
	const components = registry.list();
	if (components.length === 0) return 'No components are registered.';

	const intro = [
		'You can embed components in markdown using leaf directive syntax: ::name{attr="value" ...}',
		'Only use the components and props listed below — do not invent new ones. Read each description before choosing a component.',
	].join('\n');

	const body = components.map(([name, definition]) => describeComponent(name, definition)).join('\n\n');

	return `${intro}\n\n${body}`;
}

import type { ComponentRegistry, PropSchema } from './registry';

function describeProp(name: string, schema: PropSchema): string {
	return `${name}: ${schema.type}${schema.required ? ' (required)' : ' (optional)'}`;
}

function describeComponent(name: string, schema: Record<string, PropSchema> | undefined): string {
	const props = schema
		? Object.entries(schema)
				.map(([propName, propSchema]) => `  - ${describeProp(propName, propSchema)}`)
				.join('\n')
		: '  (no props)';
	return `::${name}{...}\n${props}`;
}

// Per ARCHITECTURE.md §5: derive the AI-facing component reference from the
// registry itself (component list + schemas) rather than hand-maintaining
// prompt docs that drift from what's actually registered.
export function generateSystemPrompt(registry: ComponentRegistry): string {
	const components = registry.list();
	if (components.length === 0) return 'No components are registered.';

	const intro = [
		'You can embed components in markdown using leaf directive syntax: ::name{attr="value" ...}',
		'Only use the components and props listed below — do not invent new ones.',
	].join('\n');

	const body = components.map(([name, definition]) => describeComponent(name, definition.schema)).join('\n\n');

	return `${intro}\n\n${body}`;
}

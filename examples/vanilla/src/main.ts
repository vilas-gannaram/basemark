import { createRegistry, renderMarkdown } from '@basemark/core';
import { registerBioComponents } from '@basemark/bio';
import { registerCommonComponents } from '@basemark/common';
import '@basemark/core/theme.css';

const registry = createRegistry();
registerBioComponents(registry);
registerCommonComponents(registry);

const source = [
	'# Vanilla renderer',
	'',
	'No React, no framework binding at all — `renderMarkdown()` from `@basemark/core` parses the ' +
		'markdown and hands back a real `DocumentFragment` of already-upgraded custom elements.',
	'',
	':::card{title="Works fine"}',
	'A normal card, rendered with zero framework code.',
	'',
	'::structure{pdbid="1cbs"}',
	':::',
	'',
	'## Invalid syntax, on purpose',
	'',
	'An unknown directive:',
	'',
	'::not-a-real-component{foo="bar"}',
	'',
	'A container missing its closing fence — everything below gets captured inside it instead of ' +
		'rendering separately, and the error banner shows what was swallowed:',
	'',
	':::card{title="Unclosed"}',
	'This text is inside the broken card.',
	'',
	'## This heading got swallowed too',
	'',
	'So did this paragraph.',
].join('\n');

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

root.appendChild(renderMarkdown(source, registry));

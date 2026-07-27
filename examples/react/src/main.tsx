import { createRoot } from 'react-dom/client';
import { createRegistry } from '@basemark/core';
import { registerBioComponents } from '@basemark/bio';
import { registerCommonComponents } from '@basemark/common';
import { MarkdownRenderer } from '@basemark/react';
import '@basemark/core/theme.css';

const registry = createRegistry();
registerBioComponents(registry);
registerCommonComponents(registry);

const source = [
	'# React renderer',
	'',
	'`MarkdownRenderer` from `@basemark/react` parses the markdown and mounts every resolved custom ' +
		"element as a real React component — via a generic wrapper (`@lit/react`'s `createComponent`), " +
		'not per-component code.',
	'',
	':::card{title="Works fine"}',
	'A normal card, rendered through the React binding.',
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

createRoot(root).render(<MarkdownRenderer source={source} registry={registry} />);

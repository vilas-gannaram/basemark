import { createRoot } from 'react-dom/client';
import { createRegistry } from '@basemark/core';
import { registerBioComponents } from '@basemark/bio';
import { MarkdownRenderer } from '@basemark/react';

const registry = createRegistry();
registerBioComponents(registry);

const source = '::locuszoom-assoc{chrom="10" start="114550452" end="115067678"}';

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

createRoot(root).render(<MarkdownRenderer source={source} registry={registry} />);

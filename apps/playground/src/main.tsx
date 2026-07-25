import { createRoot } from 'react-dom/client';
import { createRegistry } from '@basemark/core';
import { registerBioComponents } from '@basemark/bio';
import { MarkdownRenderer } from '@basemark/react';

const registry = createRegistry();
registerBioComponents(registry);

const source = [
	'::protvista{accession="P05067"}',
	'',
	'::structure{pdbid="1cbs"}',
	'',
	'::locuszoom-assoc{chrom="10" start="114550452" end="115067678"}',
	'',
	'::locuszoom-gwas-catalog{chrom="9" start="21751670" end="22351670"}',
	'',
	'::locuszoom-phewas{variant="10:114758349_C/T"}',
	'',
	'::locuszoom-intervals{chrom="10" start="114550452" end="115067678"}',
	'',
	'::locuszoom-credible-sets{chrom="16" start="74947245" end="75547245"}',
	'',
	'::locuszoom-multi-pheno{chrom="10" start="114550452" end="115067678"}',
].join('\n');

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

createRoot(root).render(<MarkdownRenderer source={source} registry={registry} />);

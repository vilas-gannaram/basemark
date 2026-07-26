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
	':::card{title="3D Structure (1cbs)"}',
	'::structure{pdbid="1cbs"}',
	':::',
	'',
	':::columns{cols="2"}',
	'::locuszoom-assoc{chrom="10" start="114550452" end="115067678"}',
	'',
	'::locuszoom-gwas-catalog{chrom="9" start="21751670" end="22351670"}',
	':::',
	'',
	'::::tabs',
	':::tab-panel{label="Structure"}',
	'::structure{pdbid="1cbs"}',
	':::',
	'',
	':::tab-panel{label="Sequence"}',
	'::protvista{accession="P05067"}',
	':::',
	'::::',
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

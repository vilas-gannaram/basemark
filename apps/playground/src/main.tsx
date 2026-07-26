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
	':::card',
	'A card with no title — just plain markdown, no `title` attr at all.',
	':::',
	'',
	':::card{title="Title only, plain text"}',
	'A card with a title and a single paragraph of body text. This is the plain, no-frills case — no lists, no nested components, just prose to see how the title-to-body spacing reads with ordinary text.',
	':::',
	'',
	':::card{title="Title + multiple blocks"}',
	'A title can sit above more than one block: a paragraph, then a list.',
	'',
	'- First point',
	'- Second point',
	'- Third point',
	':::',
	'',
	':::card{title="3D Structure (1cbs)"}',
	'::structure{pdbid="1cbs"}',
	':::',
	'',
	'::::card{title="Nested card"}',
	'An outer card can hold an inner :::card::: — this is the one case that actually exercises nested containers (needs more colons on the outer fence than the inner one, per remark-directive).',
	'',
	':::card{title="Inner card"}',
	'Content of the inner card.',
	':::',
	'::::',
	'',
	':::::card{title="Cards in columns, inside a card"}',
	'Three levels deep: this outer card holds a columns block, which holds two more cards.',
	'',
	'::::columns{cols="2"}',
	':::card{title="Left"}',
	'First inner card.',
	':::',
	'',
	':::card{title="Right"}',
	'Second inner card.',
	':::',
	'::::',
	':::::',
	'',
	'::::card{title="Columns of components, inside a card"}',
	'Same idea, but the columns children are other bio components directly — no inner card wrapper needed.',
	'',
	':::columns{cols="2"}',
	'::structure{pdbid="1cbs"}',
	'',
	'::protvista{accession="P05067"}',
	':::',
	'::::',
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

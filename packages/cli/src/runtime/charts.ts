// Only inlined when a document resolves a 'charts' directive (render.ts's usedDomains()).
import { createRegistry } from '@basemark/core';
import { registerChartsComponents } from '@basemark/charts';

registerChartsComponents(createRegistry());

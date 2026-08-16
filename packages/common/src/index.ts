import type { ComponentRegistry } from '@basemark/core';
import { registerCard } from './card';
import { registerColumns } from './columns';
import { registerTabs } from './tabs';
import { registerButton } from './button';
import { registerBadge } from './badge';
import { registerAlert } from './alert';
import { registerSeparator } from './separator';
import { registerAccordion } from './accordion';
import { registerCarousel } from './carousel';
import { registerPopover } from './popover';
import { registerVideo } from './video';
import { registerAudio } from './audio';

export * from './card';
export * from './columns';
export * from './tabs';
export * from './button';
export * from './badge';
export * from './alert';
export * from './separator';
export * from './accordion';
export * from './carousel';
export * from './popover';
export * from './video';
export * from './audio';

// TODO: register chart/map/katex web components once implemented.
export function registerCommonComponents(registry: ComponentRegistry): void {
	registerCard(registry);
	registerColumns(registry);
	registerTabs(registry);
	registerButton(registry);
	registerBadge(registry);
	registerAlert(registry);
	registerSeparator(registry);
	registerAccordion(registry);
	registerCarousel(registry);
	registerPopover(registry);
	registerVideo(registry);
	registerAudio(registry);
}

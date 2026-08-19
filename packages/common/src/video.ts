import type { ComponentRegistry } from '@basemark/core';

export const VIDEO_TAG = 'basemark-video';

// Tier 0 (ARCH §2) — resolves the provider from a plain page URL. Only the
// extracted ID (restricted charset) is interpolated, never the raw url.
function resolveEmbed(url: string): IVideoEmbed | null {
	const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
	if (youtube) return { provider: 'YouTube', embedUrl: `https://www.youtube.com/embed/${youtube[1]}` };

	const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
	if (vimeo) return { provider: 'Vimeo', embedUrl: `https://player.vimeo.com/video/${vimeo[1]}` };

	return null;
}

const STYLES = `
	:host {
		display: block;
		margin: 1.5rem 0;
	}
	.frame {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--muted);
	}
	iframe {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: none;
	}
	.error {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 1rem;
		box-sizing: border-box;
		text-align: center;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--destructive);
	}
`;

export function registerVideo(registry: ComponentRegistry): void {
	// See AGENTS.md's "never declare a custom element class at module scope" — this guard is why.
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		class VideoElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['url'];
			}

			constructor() {
				super();
				this.attachShadow({ mode: 'open' });
			}

			connectedCallback(): void {
				this.render();
			}

			attributeChangedCallback(): void {
				if (this.isConnected) this.render();
			}

			private render(): void {
				const root = this.shadowRoot as ShadowRoot;
				const url = this.getAttribute('url') ?? '';
				const embed = resolveEmbed(url);

				root.innerHTML = `
					<style>${STYLES}</style>
					<div class="frame">
						${
							embed
								? `<iframe src="${embed.embedUrl}" title="${embed.provider} video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`
								: `<div class="error">Unsupported video URL — supported providers: YouTube, Vimeo.</div>`
						}
					</div>
				`;
			}
		}

		if (!customElements.get(VIDEO_TAG)) {
			customElements.define(VIDEO_TAG, VideoElement);
		}
	}

	registry.register('video', {
		tag: VIDEO_TAG,
		domain: 'common',
		title: 'Video',
		description:
			'Embeds a YouTube or Vimeo video from its ordinary page URL: ::video{url="https://www.youtube.com/watch?v=..."}. ' +
			'Tier 0 — provider and video ID are both detected from the URL; nothing else to author.',
		schema: {
			url: {
				type: 'string',
				required: true,
				description: 'A YouTube or Vimeo video page URL (not an embed URL).',
			},
		},
	});
}

interface IVideoEmbed {
	provider: 'YouTube' | 'Vimeo';
	embedUrl: string;
}

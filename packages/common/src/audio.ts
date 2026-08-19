import type { ComponentRegistry } from '@basemark/core';

export const AUDIO_TAG = 'basemark-audio';

interface AudioEmbed {
	provider: 'Spotify' | 'SoundCloud';
	embedUrl: string;
	height: number;
}

// Tier 0, same reasoning as video.ts. Spotify needs a (type, id) pair pulled
// out of the URL to build its /embed/ path; SoundCloud's player accepts any
// original track/playlist/set URL directly via a `url` query param, no ID
// extraction needed — so that branch passes the url straight through
// (encoded), rather than parsing it apart like the other three providers
// across this file and video.ts do.
function resolveEmbed(url: string): AudioEmbed | null {
	const spotify = url.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/(\w+)/);
	if (spotify) {
		return { provider: 'Spotify', embedUrl: `https://open.spotify.com/embed/${spotify[1]}/${spotify[2]}`, height: 152 };
	}

	if (/^https:\/\/(www\.)?soundcloud\.com\//.test(url)) {
		// Passing the whole url through this player, not extracting an ID —
		// this is the one provider (here or in video.ts) that works this way.
		// SoundCloud's own theming params take a raw hex color, which would
		// need converting theme.css's OKLCH tokens at runtime to use — left
		// as the provider's own default look rather than doing that.
		return { provider: 'SoundCloud', embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}`, height: 166 };
	}

	return null;
}

const STYLES = `
	:host {
		display: block;
		margin: 1.5rem 0;
	}
	.frame {
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--muted);
	}
	iframe {
		display: block;
		width: 100%;
		border: none;
	}
	.error {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		box-sizing: border-box;
		text-align: center;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--destructive);
	}
`;

export function registerAudio(registry: ComponentRegistry): void {
	// See AGENTS.md's "never declare a custom element class at module scope" — this guard is why.
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		class AudioElement extends HTMLElement {
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
				const height = embed?.height ?? 96;

				root.innerHTML = `
					<style>${STYLES}</style>
					<div class="frame" style="height: ${height}px">
						${
							embed
								? `<iframe src="${embed.embedUrl}" title="${embed.provider} audio" height="${embed.height}" allow="autoplay; encrypted-media" loading="lazy"></iframe>`
								: `<div class="error">Unsupported audio URL — supported providers: Spotify, SoundCloud.</div>`
						}
					</div>
				`;
			}
		}

		if (!customElements.get(AUDIO_TAG)) {
			customElements.define(AUDIO_TAG, AudioElement);
		}
	}

	registry.register('audio', {
		tag: AUDIO_TAG,
		domain: 'common',
		title: 'Audio',
		description:
			'Embeds a Spotify track/album/playlist/episode/show or a SoundCloud track from its ordinary page URL: ' +
			'::audio{url="https://open.spotify.com/track/..."}. Tier 0 — provider and any needed ID are detected from ' +
			'the URL; nothing else to author.',
		schema: {
			url: {
				type: 'string',
				required: true,
				description: 'A Spotify or SoundCloud page URL (not an embed URL).',
			},
		},
	});
}

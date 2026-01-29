<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import UntronLogo from './UntronLogo.svelte';
	import type { Snippet } from 'svelte';

	export type FooterLink = {
		id: string;
		label: string;
		href: string;
		external?: boolean;
	};

	export type FooterNavGroup = {
		id: string;
		title: string;
		links: ReadonlyArray<FooterLink>;
	};

	export type FooterContact = {
		label: string;
		href?: string;
	};

	type Props = {
		navGroups?: ReadonlyArray<FooterNavGroup>;
		contacts?: ReadonlyArray<FooterContact>;
		contactsTitle?: string;
		tagline?: string;
		copyright?: string;
		maxWidthClass?: string;
		topRight?: Snippet;
		copyrightMeta?: Snippet;
		children?: Snippet;
	};

	const {
		navGroups = [],
		contacts = [],
		contactsTitle = 'Contacts',
		tagline,
		copyright,
		maxWidthClass = 'max-w-6xl',
		topRight,
		copyrightMeta,
		children
	}: Props = $props();

	const currentYear = new Date().getFullYear();
	let prefersReducedMotion = $state(false);

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const handleChange = () => (prefersReducedMotion = mediaQuery.matches);

		handleChange();
		mediaQuery.addEventListener('change', handleChange);

		return () => {
			mediaQuery.removeEventListener('change', handleChange);
		};
	});

	const fadeOptions = $derived.by(() => ({
		duration: prefersReducedMotion ? 0 : 220,
		delay: prefersReducedMotion ? 0 : 40
	}));
</script>

<footer class="mt-24 text-sm text-muted-foreground">
	<div class="mx-auto flex w-full {maxWidthClass} flex-col gap-10 px-4 py-12 md:px-8">
		<div
			class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
			in:fade={fadeOptions}
		>
			<div class="flex items-center gap-4">
				<UntronLogo class="group flex items-center" />
			</div>
			{#if topRight}
				{@render topRight?.()}
			{/if}
		</div>

		{#if navGroups.length || contacts.length}
			<div class="grid gap-8 md:grid-cols-3" in:fade={fadeOptions}>
				{#each navGroups as group (group.id)}
					<div class="space-y-3">
						<p class="text-xs font-semibold tracking-[0.2em] text-foreground/60 uppercase">
							{group.title}
						</p>
						<ul class="space-y-2">
							{#each group.links as link (link.id)}
								<li>
									<a
										href={link.href}
										target={link.external ? '_blank' : undefined}
										rel={link.external ? 'noreferrer noopener' : undefined}
										class="inline-flex items-center gap-1 transition-colors hover:text-foreground focus-visible:text-foreground"
									>
										{link.label}
										{#if link.external}
											<span aria-hidden="true" class="text-xs">↗</span>
										{/if}
									</a>
								</li>
							{/each}
						</ul>
					</div>
				{/each}

				{#if contacts.length}
					<div class="space-y-3">
						<p class="text-xs font-semibold tracking-[0.2em] text-foreground/60 uppercase">
							{contactsTitle}
						</p>
						<ul class="space-y-2">
							{#each contacts as contact (contact.label)}
								<li>
									{#if contact.href}
										<a
											href={contact.href}
											class="transition-colors hover:text-foreground focus-visible:text-foreground"
										>
											{contact.label}
										</a>
									{:else}
										<span>{contact.label}</span>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{/if}

		<div class="flex flex-col gap-3 border-t border-border/60 pt-6 text-xs" in:fade={fadeOptions}>
			<div class="flex flex-wrap items-center gap-3">
				<span>{copyright ?? `© ${currentYear} Untron`}</span>
				{#if copyrightMeta}
					{@render copyrightMeta?.()}
				{/if}
			</div>
			{#if tagline}
				<p class="text-muted-foreground/80">{tagline}</p>
			{/if}
		</div>

		{@render children?.()}
	</div>
</footer>

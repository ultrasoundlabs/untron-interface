<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';

	type Link = {
		id: string;
		label: () => string;
		href: string;
		external?: boolean;
	};

	type NavGroup = {
		id: string;
		title: () => string;
		links: Link[];
	};

	type Contact = {
		label: string;
		href?: string;
	};

	const navGroups: NavGroup[] = [
		{
			id: 'project',
			title: () => m.footer_project_title(),
			links: [
				{
					id: 'blog',
					label: () => m.footer_blog(),
					href: 'https://x.com/untronfi',
					external: true
				},
				{
					id: 'about',
					label: () => m.footer_about_us(),
					href: 'https://x.com/untronfi',
					external: true
				},
				{
					id: 'terms',
					label: () => m.footer_terms_of_service(),
					href: 'https://www.wtfpl.net/wp-content/uploads/2012/12/freedom.jpeg',
					external: true
				},
				{
					id: 'brand',
					label: () => m.footer_brand_assets(),
					href: 'https://github.com/ultrasoundlabs/brandkit',
					external: true
				}
			]
		},
		{
			id: 'socials',
			title: () => m.footer_socials_title(),
			links: [
				{
					id: 'twitter',
					label: () => m.footer_x_twitter(),
					href: 'https://x.com/untronfi',
					external: true
				},
				{
					id: 'telegram',
					label: () => m.footer_telegram(),
					href: 'https://t.me/untronchat',
					external: true
				},
				{
					id: 'github',
					label: () => m.footer_github(),
					href: 'https://github.com/ultrasoundlabs',
					external: true
				}
			]
		}
	];

	const contactEntries: Contact[] = [
		{ label: 'Ultrasound Labs LLC' },
		{ label: 'contact@untron.finance', href: 'mailto:contact@untron.finance' }
	];

	// const companyTagline = 'Untron the finance.';
	const currentYear = new Date().getFullYear();

	let prefersReducedMotion = false;

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const handleChange = () => (prefersReducedMotion = mediaQuery.matches);

		handleChange();
		mediaQuery.addEventListener('change', handleChange);

		return () => {
			mediaQuery.removeEventListener('change', handleChange);
		};
	});

	$: fadeOptions = {
		duration: prefersReducedMotion ? 0 : 220,
		delay: prefersReducedMotion ? 0 : 40
	};
</script>

<footer class="mt-24 text-sm text-muted-foreground">
	<div class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 md:px-8">
		<div
			class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
			in:fade={fadeOptions}
		>
			<div class="flex items-center gap-4">
				<img src="/logos/untron/full.svg" alt="Untron" class="h-10 w-auto dark:invert" />
			</div>
			<!-- <p class="max-w-md text-base text-foreground/80 md:text-right">{companyTagline}</p> -->
		</div>

		<div class="grid gap-8 md:grid-cols-3" in:fade={fadeOptions}>
			{#each navGroups as group (group.id)}
				<div class="space-y-3">
					<p class="text-xs font-semibold tracking-[0.2em] text-foreground/60 uppercase">
						{group.title()}
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
									{link.label()}
									{#if link.external}
										<span aria-hidden="true" class="text-xs">↗</span>
									{/if}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}

			<div class="space-y-3">
				<p class="text-xs font-semibold tracking-[0.2em] text-foreground/60 uppercase">
					{m.footer_contacts_title()}
				</p>
				<ul class="space-y-2">
					{#each contactEntries as contact (contact.label)}
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
		</div>

		<div class="flex flex-col gap-3 border-t border-border/60 pt-6 text-xs" in:fade={fadeOptions}>
			<div class="flex flex-wrap items-center gap-3">
				<span>{m.footer_copyright({ year: currentYear })}</span>
				<span>{m.footer_all_rights_reserved()}</span>
			</div>
			<p class="text-muted-foreground/80">
				{m.footer_tagline()}
			</p>
		</div>
	</div>
</footer>

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import UntronFooter from '@untron/stylekit/components/UntronFooter.svelte';

	const navGroups = [
		{
			id: 'project',
			title: m.footer_project_title(),
			links: [
				{
					id: 'blog',
					label: m.footer_blog(),
					href: 'https://x.com/untronfi',
					external: true
				},
				{
					id: 'about',
					label: m.footer_about_us(),
					href: 'https://x.com/untronfi',
					external: true
				},
				{
					id: 'terms',
					label: m.footer_terms_of_service(),
					href: 'https://www.wtfpl.net/wp-content/uploads/2012/12/freedom.jpeg',
					external: true
				},
				{
					id: 'brand',
					label: m.footer_brand_assets(),
					href: 'https://github.com/ultrasoundlabs/brandkit',
					external: true
				}
			]
		},
		{
			id: 'socials',
			title: m.footer_socials_title(),
			links: [
				{
					id: 'twitter',
					label: m.footer_x_twitter(),
					href: 'https://x.com/untronfi',
					external: true
				},
				{
					id: 'telegram',
					label: m.footer_telegram(),
					href: 'https://t.me/untronchat',
					external: true
				},
				{
					id: 'github',
					label: m.footer_github(),
					href: 'https://github.com/ultrasoundlabs',
					external: true
				}
			]
		}
	];

	const contactEntries = [
		{ label: 'Ultrasound Labs LLC' },
		{ label: 'contact@untron.finance', href: 'mailto:contact@untron.finance' }
	];
</script>

<UntronFooter
	{navGroups}
	contacts={contactEntries}
	contactsTitle={m.footer_contacts_title()}
	copyright={m.footer_copyright({ year: new Date().getFullYear() })}
	tagline={m.footer_tagline()}
>
	{#snippet copyrightMeta()}
		<span>{m.footer_all_rights_reserved()}</span>
	{/snippet}
</UntronFooter>

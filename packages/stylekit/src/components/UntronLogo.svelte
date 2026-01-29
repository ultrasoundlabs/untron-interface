<script lang="ts">
	type Props = {
		href?: string;
		class?: string;
	};

	const { href = '/', class: className }: Props = $props();
</script>

<a {href} class={className ?? 'group flex items-center'}>
	<img
		src="/logos/untron/full.svg"
		alt="Untron"
		class="hidden h-[48px] w-auto md:block dark:invert"
	/>
	<img
		src="/logos/untron/icon.svg"
		alt="Untron"
		class="block h-[48px] w-auto md:hidden dark:invert"
	/>
</a>

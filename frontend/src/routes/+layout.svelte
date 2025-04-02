<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	let { children } = $props();

	let siteName = 'GitHub Tune';
	let siteUrl = 'https://githubtune.com';
	let defaultDescription = 'Turn your GitHub contribution graph into a musical melody. See and hear your coding activity!';
	let defaultImage = `${siteUrl}/og-image.png`;
	let defaultTitle = 'GitHub Tune - Create Music from Your Contributions';
	
	let username = $derived($page.url.searchParams.get('user') || 
				 ($page.params.username ? $page.params.username : ''));
	let title = $derived(username ? 
			 `${username}'s GitHub GitHub Tune` : 
			 defaultTitle);
	let description = $derived(username ? 
			 `Listen to ${username}'s GitHub contributions as a beautiful melody. GitHub Tune transforms commits into music.` : 
			 defaultDescription);
	let canonicalUrl = $derived(username ? 
			 `${siteUrl}/${username}` : 
			 siteUrl);
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{title}</title>
	<meta name="title" content={title} />
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalUrl} />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={defaultImage} />
	<meta property="og:site_name" content={siteName} />
	
	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={canonicalUrl} />
	<meta property="twitter:title" content={title} />
	<meta property="twitter:description" content={description} />
	<meta property="twitter:image" content={defaultImage} />
	
	<!-- Additional SEO Meta Tags -->
	<meta name="keywords" content="github, contributions, commits, music, piano, melody, visualization, coding activity, developer tools" />
	<meta name="robots" content="index, follow" />
</svelte:head>

{@render children()}

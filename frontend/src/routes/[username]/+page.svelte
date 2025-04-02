<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    onMount(() => {
        const username = $page.params.username;
        if (username) {
            goto(`/?user=${username}`, { replaceState: true });
        }
    });
</script>

<div>Redirecting...</div>

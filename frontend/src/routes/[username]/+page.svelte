<script>
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    
    /** @type {import('./$types').PageData} */
    export let data;
    
    if (browser && data.username) {
        goto(`/?user=${data.username}`, { replaceState: true });
    }
</script>

<div class="flex h-screen w-full items-center justify-center text-center">
    <div>
        <h2 class="text-xl font-semibold">Redirecting to GitHub Tune...</h2>
        <p class="mt-2">If you are not redirected automatically, <a href="/?user={data.username}" class="text-blue-500 underline">click here</a>.</p>
    </div>
</div>

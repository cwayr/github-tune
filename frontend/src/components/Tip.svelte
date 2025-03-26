<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import X from '@lucide/svelte/icons/x';
  import Lightbulb from '@lucide/svelte/icons/lightbulb';
  
  export let message: string;
  export let icon: any = Lightbulb;
  export let duration: number = 6000;
  export let autoHide: boolean = true;
  export let theme: 'light' | 'dark' = 'light';
  export let tipType: string = '';
  
  const dispatch = createEventDispatcher();
  let visible = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  onMount(() => {
    // Small delay before showing the tip for better UX
    setTimeout(() => {
      visible = true;
      
      if (autoHide && duration > 0) {
        timeoutId = setTimeout(() => {
          hide();
        }, duration);
      }
    }, 500);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  });
  
  function hide() {
    visible = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    // Allow time for the hide animation before dispatching close event
    setTimeout(() => {
      dispatch('close');
    }, 300);
  }
</script>

<div class="tip-container {tipType} {theme}" class:visible>
  <div class="tip">
    <div class="tip-icon">
      {#if typeof icon === 'string'}
        {icon}
      {:else}
        <svelte:component this={icon} />
      {/if}
    </div>
    <div class="tip-message">{message}</div>
    <button class="tip-close" on:click={hide} aria-label="Close tip">
      <X size={16} />
    </button>
  </div>
</div>

<style>
  .tip-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    max-width: 320px;
    transform: translateY(100%);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
    pointer-events: none;
  }
  
  .tip-container.visible {
    transform: translateY(0);
    opacity: 1;
    pointer-events: all;
  }
  
  /* Specific tip type positioning */
  .tip-container.sound-tip,
  .tip-container.harmony-tip,
  .tip-container.copied-tip {
    bottom: 20px;
  }
  
  .tip {
    display: flex;
    align-items: center;
    gap: 20px;
    background-color: var(--background-card, #ffffff);
    color: var(--text-primary, #333333);
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .tip-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
  }
  
  .tip-message {
    flex: 1;
    font-size: 0.85rem;
    line-height: 1.4;
  }
  
  .tip-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-secondary, #666666);
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
  }
  
  .tip-close:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .tip-container.dark .tip {
    background-color: #2d3748;
    color: #f7fafc;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .tip-container.dark .tip-close {
    color: #cbd5e0;
  }
  
  .tip-container.dark .tip-close:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
</style>

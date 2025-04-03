import { writable, type Writable } from 'svelte/store';

export interface Tip {
  id: string;
  message: string;
  visible: boolean;
  timer: ReturnType<typeof setTimeout> | null;
}

export type TipStatus = Record<string, boolean>;

export const DEFAULT_TIP_DURATION = 6000;

const tips: Writable<Record<string, Tip>> = writable({});
const tipShownStatus: Writable<TipStatus> = writable({});

if (typeof localStorage !== 'undefined') {
  try {
    const savedStatus = localStorage.getItem('tipShownStatus');
    if (savedStatus) {
      tipShownStatus.set(JSON.parse(savedStatus));
    }
  } catch (e) {
    console.warn('Could not load tip preferences from localStorage:', e);
  }
}

/**
 * Show a tip with the specified ID and message
 * 
 * @param id Unique identifier for the tip
 * @param message Message to display
 * @param duration Optional duration in ms (defaults to DEFAULT_TIP_DURATION)
 * @returns Function to manually hide the tip
 */
export function showTip(id: string, message: string, duration: number = DEFAULT_TIP_DURATION): () => void {
  let tipTimer: ReturnType<typeof setTimeout> | null = null;
  
  tips.update(currentTips => {
    if (currentTips[id] && currentTips[id].timer) {
      clearTimeout(currentTips[id].timer);
    }
    
    tipTimer = setTimeout(() => hideTip(id), duration);
    
    currentTips[id] = {
      id,
      message,
      visible: true,
      timer: tipTimer
    };
    
    return currentTips;
  });
  
  return () => hideTip(id);
}

/**
 * Hide a specific tip by ID
 * 
 * @param id Tip identifier
 */
export function hideTip(id: string): void {
  tips.update(currentTips => {
    if (currentTips[id]) {
      if (currentTips[id].timer) {
        clearTimeout(currentTips[id].timer);
      }
      
      currentTips[id] = {
        ...currentTips[id],
        visible: false,
        timer: null
      };
    }
    
    return currentTips;
  });
}

/**
 * Mark a tip as shown (persisted to localStorage)
 * 
 * @param id Tip identifier
 */
export function markTipAsShown(id: string): void {
  tipShownStatus.update(status => {
    status[id] = true;
    
    try {
      localStorage.setItem('tipShownStatus', JSON.stringify(status));
    } catch (e) {
      console.warn('Could not save tip status to localStorage:', e);
    }
    
    return status;
  });
}

/**
 * Check if a tip has been shown before
 * 
 * @param id Tip identifier
 * @returns Boolean indicating if tip has been shown
 */
export function hasTipBeenShown(id: string): boolean {
  let shown = false;
  
  tipShownStatus.subscribe(status => {
    shown = !!status[id];
  })();
  
  return shown;
}

export { tips, tipShownStatus };

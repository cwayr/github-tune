export interface Error {
  userMessage: string;
  debugInfo?: unknown;
}

export function handleError(error: unknown, context: string): Error {
  const errorMessage = error instanceof Error ? error.message : 'Operation failed';
  
  console.error(`[${context}]`, error);
  
  return {
    userMessage: errorMessage,
    debugInfo: error instanceof Error ? { 
      name: error.name,
      stack: error.stack 
    } : undefined
  };
}
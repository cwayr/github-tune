export interface CustomErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  context?: Record<string, unknown>;
}

export function handleError(error: unknown, context?: string): CustomErrorResponse {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  const errorName = error instanceof Error ? error.name : 'InternalServerError';
  
  console.error(`[${new Date().toISOString()}] Error${context ? ` in ${context}` : ''}:`, error);

  return {
    statusCode: 500,
    error: errorName,
    message: errorMessage,
    ...(context && { context: { operation: context } })
  };
}

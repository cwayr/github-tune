export function parseRequestParams(params: unknown): { username: string; year: number } {
  if (typeof params !== 'object' || !params) {
    throw new Error('Invalid request parameters');
  }
  
  const { username, year } = params as { username?: unknown; year?: unknown };
  
  if (typeof username !== 'string' || typeof year !== 'string') {
    throw new Error('Missing required parameters');
  }
  
  const parsedYear = parseInt(year);
  if (isNaN(parsedYear)) {
    throw new Error('Invalid year parameter');
  }
  
  return { username, year: parsedYear };
}

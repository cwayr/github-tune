import { FetcherLambdaParams } from '../types'

export function parseRequestParams(params: unknown): FetcherLambdaParams {
  if (typeof params !== 'object' || !params) {
    throw new Error('Invalid request parameters');
  }
  
  const { username, year } = params as FetcherLambdaParams;

  if (!username) {
    throw new Error(`Missing required username parameter`);
  }
  
  if (year && !/^\d{4}$/.test(year)) {
    throw new Error('Year must be a 4-digit number');
  }

  return { username, year };
}

import { FetcherLambdaParams } from '../types/index'

export function parseRequestParams(params: unknown): FetcherLambdaParams {
  if (typeof params !== 'object' || !params) {
    throw new Error('Invalid request parameters');
  }
  
  const { username } = params as FetcherLambdaParams;

  if (!username) {
    throw new Error(`Missing required username parameter`);
  }
  return { username };
}

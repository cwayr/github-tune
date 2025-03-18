import { FetcherLambdaParams } from '../types'

export function parseRequestParams(params: unknown): FetcherLambdaParams {
  if (typeof params !== 'object' || !params) {
    throw new Error('Invalid request parameters');
  }
  
  const { username } = params as FetcherLambdaParams;

  if (username === undefined) {
    throw new Error(`Missing required parameters. Received: ${JSON.stringify(params)}`);
  }

  if (typeof username !== 'string') {
    throw new Error('Username must be a string');
  }

  return { username };
}

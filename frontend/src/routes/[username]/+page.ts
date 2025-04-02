import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const prerender = false;

export const load: PageLoad = async ({ params }) => {
  const { username } = params;
  
  throw redirect(302, `/?user=${username}`);
};
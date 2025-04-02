import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const { username } = params;
    
    // Redirect to the main page with the username as a query parameter
    throw redirect(302, `/?user=${username}`);
};

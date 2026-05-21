import { redirect } from '@sveltejs/kit';

export const load = () => {
	// Redirect root to dashboard.
	// The (app)/+layout.server.js will handle redirecting to login if not authenticated.
	throw redirect(303, '/dashboard');
};

import { createSupabaseServerClient } from '$lib/server/supabase';

export const handle = async ({ event, resolve }) => {
	// Initialize Supabase client
	event.locals.supabase = createSupabaseServerClient(event);

	/**
	 * A convenience helper so we can just call await event.locals.safeGetSession() in
	 * +page.server.js/js load functions to check auth.
	 *
	 * SafeGetSession uses getUser() instead of getSession() as recommended by Supabase
	 * for SSR environments to ensure the token is still valid.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		
		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		
		if (error) {
			// JWT validation has failed
			return { session: null, user: null };
		}

		// Also get the profile to know the user's role and branch_id
		let profile = null;
		if (user) {
			const { data } = await event.locals.supabase
				.from('profiles')
				.select('*')
				.eq('id', user.id)
				.single();
				
			profile = data;
		}

		return { session, user, profile };
	};

	// Return the resolved response, injecting supabase into the context
	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			/**
			 * Supabase libraries use the `content-range` and `x-supabase-api-version`
			 * headers, so we need to tell SvelteKit to pass it through.
			 */
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

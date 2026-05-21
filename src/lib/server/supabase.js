import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import { PRIVATE_SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for use on the server.
 * Requires event to set/get cookies correctly during SSR.
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export const createSupabaseServerClient = (event) => {
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				/**
				 * setAll is called when the session is refreshed.
				 * This must be done inside a try/catch block because we might
				 * not have access to set cookies in certain contexts (like from a page).
				 */
				try {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				} catch {
					// The `setAll` method was called from a context where cookies cannot be set
					// like a Server Component or inside a page. This can be ignored.
				}
			}
		}
	});
};

/**
 * Creates a Supabase admin client using the service role key.
 * Only use this in server actions where bypassing RLS or managing users is required.
 */
export const supabaseAdmin = createClient(
	PUBLIC_SUPABASE_URL, 
	PRIVATE_SUPABASE_SERVICE_ROLE_KEY, 
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	}
);

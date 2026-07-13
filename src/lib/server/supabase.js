import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import { PRIVATE_SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for use on the server.
 * Requires event to set/get cookies correctly during SSR.
 *
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export const createSupabaseServerClient = (event) => {
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				try {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				} catch {
					// Silent fallback during static routing/rendering
				}
			}
		}
	});
};

/** @type {any} */
let adminClient = null;
/** @type {any} */
export const supabaseAdmin = new Proxy(
	{},
	{
		get(target, prop) {
			if (!adminClient) {
				if (!PUBLIC_SUPABASE_URL || !PRIVATE_SUPABASE_SERVICE_ROLE_KEY) {
					throw new Error(
						'PUBLIC_SUPABASE_URL or PRIVATE_SUPABASE_SERVICE_ROLE_KEY is missing when trying to access supabaseAdmin.'
					);
				}
				adminClient = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_ROLE_KEY, {
					auth: {
						autoRefreshToken: false,
						persistSession: false
					}
				});
			}
			const val = adminClient[prop];
			if (typeof val === 'function') {
				return val.bind(adminClient);
			}
			return val;
		}
	}
);

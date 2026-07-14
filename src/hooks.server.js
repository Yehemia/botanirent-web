import { redirect } from '@sveltejs/kit';
import { createSupabaseServerClient, supabaseAdmin } from '$lib/server/supabase';

// In-memory cache for user sessions
const sessionCache = new Map();
const CACHE_TTL_MS = 15000;

// Periodically clean up expired cache items to prevent memory leaks during hot reload/production
if (globalThis['sessionCacheCleanupInterval']) {
	clearInterval(globalThis['sessionCacheCleanupInterval']);
}
globalThis['sessionCacheCleanupInterval'] = setInterval(() => {
	const now = Date.now();
	for (const [key, value] of sessionCache.entries()) {
		if (now - value.timestamp > CACHE_TTL_MS) {
			sessionCache.delete(key);
		}
	}
}, 60000);

/** @type {import('@sveltejs/kit').Handle} */
export const handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient(event);

	// Intercept auth code from any page request (except auth routes)
	const code = event.url.searchParams.get('code');
	const path = event.url.pathname;
	if (code && path !== '/callback' && path !== '/set-password') {
		try {
			await event.locals.supabase.auth.exchangeCodeForSession(code);
			
			const cleanUrl = new URL(event.url);
			cleanUrl.searchParams.delete('code');
			
			throw redirect(303, cleanUrl.pathname + cleanUrl.search);
		} catch (err) {
			const redirectError = /** @type {any} */ (err);
			if (
				redirectError &&
				typeof redirectError === 'object' &&
				'status' in redirectError &&
				redirectError.status >= 300 &&
				redirectError.status < 400
			) {
				throw redirectError;
			}
			console.error('Error exchanging code in global middleware:', err);
		}
	}

	/**
	 * Convenience helper to check auth in load functions.
	 * Uses getUser() instead of getSession() as recommended by Supabase for SSR.
	 */
	event.locals.safeGetSession = async () => {
		const localsWithPromise = /** @type {any} */ (event.locals);
		if (localsWithPromise._sessionPromise) {
			return localsWithPromise._sessionPromise;
		}

		localsWithPromise._sessionPromise = (async () => {
			try {
				// Combine all auth chunk cookies into a unique tokenKey for caching
				const authCookies = event.cookies
					.getAll()
					.filter(
						(c) =>
							c.name.startsWith('sb-') &&
							c.name.includes('-auth-token') &&
							!c.name.includes('-code-verifier')
					)
					.sort((a, b) => a.name.localeCompare(b.name));

				const tokenKey = authCookies.length > 0 ? authCookies.map((c) => c.value).join('|') : null;

				if (!tokenKey) {
					return { session: null, user: null, profile: null };
				}

				const isGet = event.request.method === 'GET';

				if (!isGet) {
					sessionCache.delete(tokenKey);
				}

				if (isGet) {
					const cached = sessionCache.get(tokenKey);
					const now = Date.now();
					if (cached && now - cached.timestamp < CACHE_TTL_MS) {
						return cached.data;
					}
				}

				const {
					data: { user },
					error
				} = await event.locals.supabase.auth.getUser();

				if (error || !user) {
					return { session: null, user: null, profile: null };
				}

				let profile = null;
				const { data: profileData, error: profileError } = await event.locals.supabase
					.from('profiles')
					.select('*')
					.eq('id', user.id)
					.single();

				if (!profileError && profileData) {
					profile = profileData;
				} else {
					// Fallback: If profile doesn't exist, create it using supabaseAdmin
					console.log(`Profile missing for user ${user.id}. Attempting to auto-create...`);
					const { data: newProfile, error: insertError } = await supabaseAdmin
						.from('profiles')
						.insert({
							id: user.id,
							full_name: user.user_metadata?.full_name || user.email || 'Google User',
							avatar_url: user.user_metadata?.avatar_url || null,
							role: 'kasir'
						})
						.select()
						.single();

					if (!insertError && newProfile) {
						profile = newProfile;
						console.log(`Successfully auto-created profile for user ${user.id}`);
					} else {
						console.error('Failed to auto-create profile:', insertError);
					}
				}

				// Construct synthetic session to satisfy client-side loader/layout truthiness checks
				const session = {
					user,
					expires_at: Math.floor(Date.now() / 1000) + 3600,
					expires_in: 3600,
					token_type: 'bearer',
					access_token: 'dummy',
					refresh_token: 'dummy'
				};

				const result = { session, user, profile };

				if (isGet) {
					sessionCache.set(tokenKey, {
						data: result,
						timestamp: Date.now()
					});
				}

				return result;
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error('[Supabase Connection Error/Offline]:', message);
				return { session: null, user: null, profile: null };
			}
		})();

		return localsWithPromise._sessionPromise;
	};

	return resolve(event, {
		filterSerializedResponseHeaders(/** @type {string} */ name) {
			// SvelteKit strips headers by default; pass through supabase requirements
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

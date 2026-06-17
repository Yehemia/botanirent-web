import { createSupabaseServerClient, supabaseAdmin } from '$lib/server/supabase';

// In-memory cache for validated user sessions/profiles to speed up navigation
const sessionCache = new Map();
const CACHE_TTL_MS = 15000; // 15 seconds is perfect for rapid navigation

// Clean up expired cache items periodically to prevent memory leaks in dev/prod
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
		// Use bracket notation to avoid TypeScript static type errors on Locals interface
		const localsWithPromise = /** @type {any} */ (event.locals);
		if (localsWithPromise._sessionPromise) {
			return localsWithPromise._sessionPromise;
		}

		localsWithPromise._sessionPromise = (async () => {
			try {
				// Find all auth token chunk cookies and combine their values to form a unique key
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

				// If there is no auth cookie, the user is definitely not logged in
				if (!tokenKey) {
					return { session: null, user: null, profile: null };
				}

				const isGet = event.request.method === 'GET';

				// Invalidate cache for mutations/POST requests
				if (!isGet && tokenKey) {
					sessionCache.delete(tokenKey);
				}

				// For GET requests, check the in-memory cache first to make navigation instant
				if (isGet) {
					const cached = sessionCache.get(tokenKey);
					const now = Date.now();
					if (cached && now - cached.timestamp < CACHE_TTL_MS) {
						return cached.data;
					}
				}

				// Otherwise, perform the full check by calling getUser()
				const {
					data: { user },
					error
				} = await event.locals.supabase.auth.getUser();

				if (error || !user) {
					return { session: null, user: null, profile: null };
				}

				// Fetch the profile associated with the user
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
							role: 'kasir' // Default role
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

				// Construct a synthetic session object containing the user info
				// to satisfy layout/page loader truthiness checks without calling getSession()
				const session = {
					user,
					expires_at: Math.floor(Date.now() / 1000) + 3600,
					expires_in: 3600,
					token_type: 'bearer',
					access_token: 'dummy',
					refresh_token: 'dummy'
				};

				const result = { session, user, profile };

				// Cache the result for future GET requests
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

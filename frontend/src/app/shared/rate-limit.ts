/**
 * The fixed window of the API's rate limits, in seconds, as set in `Api/appsettings.json`;
 * after a 429 the page waits it out client-side rather than asking the API for Retry-After
 */
export const RATE_LIMIT_WINDOW_SECONDS = 60;

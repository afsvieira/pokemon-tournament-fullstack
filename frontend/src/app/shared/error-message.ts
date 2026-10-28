import { HttpErrorResponse } from '@angular/common/http';

/**
 * Picks the message to show for a failed round-by-round request: the API's own `error` when the body has one,
 * otherwise a fixed message by status, worded as on the Instant Simulation page.
 * @param error - The failed request's error response
 * @returns A message fit to show the user
 */
export function getErrorMessage(error: HttpErrorResponse): string {
  const apiMessage = error.error?.error;
  if (typeof apiMessage === 'string' && apiMessage) {
    return apiMessage;
  }
  if (error.status === 0) {
    return 'Unable to connect to the server. Please check if the API is running.';
  }
  if (error.status === 429) {
    return 'Too many requests. Please wait a minute and try again.';
  }
  if (error.status >= 500) {
    return 'Server error occurred. Please try again later.';
  }
  return 'An unexpected error occurred. Please try again.';
}

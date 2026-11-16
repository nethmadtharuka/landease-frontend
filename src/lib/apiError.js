// Turns an axios error into a message safe to show users. The API always answers with
// { success, message, errorCode, errors } (ApiResponse); network failures have no response.
export function apiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data;
  if (data?.errors?.length > 1) return data.errors.join(' ');
  if (data?.message) return data.message;
  if (err?.response?.status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (!err?.response) return 'Cannot reach LandEase right now. Check your connection and try again.';
  return fallback;
}

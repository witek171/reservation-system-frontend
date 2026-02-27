export function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string')
    return error;
  const err = error as Record<string, unknown> | undefined;
  if (err?.userMessage && typeof err.userMessage === 'string')
    return err.userMessage as string;
  const details = err?.details as Array<{ message?: string }> | undefined;
  if (Array.isArray(details) && details.length > 0 && details[0].message)
    return details[0].message;
  if (err?.message && typeof err.message === 'string')
    return err.message as string;
  return 'Something went wrong. Please try again';
}

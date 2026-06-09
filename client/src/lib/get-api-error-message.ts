export function getApiErrorMessage(
  error: unknown,
  fallback = 'Não foi possível concluir a operação. Tente novamente.',
): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response
      ?.data?.message === 'string'
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    Array.isArray(
      (error as { response?: { data?: { message?: unknown } } }).response?.data
        ?.message,
    )
  ) {
    const messages = (error as { response: { data: { message: string[] } } })
      .response.data.message
    return messages[0] ?? fallback
  }

  return fallback
}

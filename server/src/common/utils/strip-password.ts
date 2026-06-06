type WithPassword = { password: string };

export function stripPassword<T extends WithPassword>(
  user: T,
): Omit<T, 'password'> {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

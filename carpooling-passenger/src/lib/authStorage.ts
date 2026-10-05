const REFRESH_KEY = "refreshToken";
const TOKEN_KEY = "token";
const USER_KEY = "user";

/** sessionStorage refresh tokens were lost on browser close — migrate once */
export function migrateRefreshTokenFromSession(): void {
  const legacy = sessionStorage.getItem(REFRESH_KEY);
  if (legacy) {
    localStorage.setItem(REFRESH_KEY, legacy);
    sessionStorage.removeItem(REFRESH_KEY);
  }
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}

export function clearAuthStorage(): void {
  localStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

import { STORAGE_KEYS } from "@/constants";

/** sessionStorage refresh tokens were lost on browser close — migrate once */
export function migrateRefreshTokenFromSession(): void {
  const legacy = sessionStorage.getItem(STORAGE_KEYS.refreshToken);
  if (legacy) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, legacy);
    sessionStorage.removeItem(STORAGE_KEYS.refreshToken);
  }
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.refreshToken);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.refreshToken, token);
}

export function clearAuthStorage(): void {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  sessionStorage.removeItem(STORAGE_KEYS.refreshToken);
}

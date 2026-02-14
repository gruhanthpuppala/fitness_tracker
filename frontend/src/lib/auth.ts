import type { AuthTokens } from "@/types/user";

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("refresh_token");
}

export function setRefreshToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    sessionStorage.setItem("refresh_token", token);
  } else {
    sessionStorage.removeItem("refresh_token");
  }
}

export function setTokens(tokens: AuthTokens): void {
  setAccessToken(tokens.access);
  setRefreshToken(tokens.refresh);
}

export function clearTokens(): void {
  setAccessToken(null);
  setRefreshToken(null);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken() || !!getRefreshToken();
}

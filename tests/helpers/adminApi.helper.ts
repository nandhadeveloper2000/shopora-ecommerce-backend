import { buildAuthTokens } from "./auth.helper";

export function adminAuth(user: { _id: unknown; email: string; role: string }) {
  const { accessToken } = buildAuthTokens(user);
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}
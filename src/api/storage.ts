import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "yala_access_token";
const REFRESH_TOKEN_KEY = "yala_refresh_token";

export const tokenStorage = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) =>
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token),
  deleteAccessToken: () => SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),

  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) =>
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token),
  deleteRefreshToken: () => SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  },
};

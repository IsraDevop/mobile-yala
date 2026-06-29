import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { tokenStorage } from "../api/storage";
import { authService } from "../services/authService";
import type { AuthResponse, UserRole } from "../types";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isVerifiedSeller: boolean;
  isIdentityVerified: boolean;
  avatarUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function mapProfile(profile: Awaited<ReturnType<typeof authService.getCurrentUser>>): AuthUser {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      isVerifiedSeller: profile.isVerifiedSeller ?? false,
      isIdentityVerified: profile.isIdentityVerified ?? false,
      avatarUrl: profile.avatarUrl ?? null,
    };
  }

  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        if (!token) return;
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp * 1000 <= Date.now()) {
          await tokenStorage.clearTokens();
          return;
        }
        const profile = await authService.getCurrentUser();
        setUser(mapProfile(profile));
      } catch {
        await tokenStorage.clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (data: AuthResponse) => {
    await tokenStorage.setTokens(data.accessToken, data.refreshToken);
    const profile = await authService.getCurrentUser();
    setUser(mapProfile(profile));
  }, []);

  const logout = useCallback(async () => {
    await tokenStorage.clearTokens();
    setUser(null);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) return;
      const { data } = await import("axios").then((m) =>
        m.default.post<AuthResponse>(
          `${process.env.EXPO_PUBLIC_API_URL ?? "https://yala.dpdns.org/api/v1"}/auth/refresh-token`,
          { refreshToken }
        )
      );
      await tokenStorage.setTokens(data.accessToken, data.refreshToken);
      const profile = await authService.getCurrentUser();
      setUser(mapProfile(profile));
    } catch {
      // Si falla el refresh la sesión sigue activa; se reintentará al siguiente uso
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

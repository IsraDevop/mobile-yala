import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { tokenStorage } from "../api/storage";
import type { AuthResponse, UserRole } from "../types";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehidratación: al montar lee el token desde SecureStore → la sesión sobrevive al cerrar y abrir la app
  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        if (!token) return;
        // Decode JWT payload to restore user identity without an extra network call
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser({
            id: payload.userId ?? payload.sub,
            name: payload.name ?? "",
            email: payload.email ?? payload.sub,
            role: payload.role ?? "USER",
          });
        } else {
          await tokenStorage.clearTokens();
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (data: AuthResponse) => {
    await tokenStorage.setTokens(data.accessToken, data.refreshToken);
    setUser({
      id: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
    });
  }, []);

  const logout = useCallback(async () => {
    await tokenStorage.clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
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

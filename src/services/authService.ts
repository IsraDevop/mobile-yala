import { api } from "../api/client";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdateUserRequest,
  User,
} from "../types";

export const authService = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>("/auth/login", data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>("/auth/register", data).then((r) => r.data),

  getCurrentUser: () =>
    api.get<User>("/users/me").then((r) => r.data),

  updateCurrentUser: (data: UpdateUserRequest) =>
    api.put<User>("/users/me", data).then((r) => r.data),
};

import { api } from "../api/client";
import type { Category } from "../types";

export const categoryService = {
  findAll: () => api.get<Category[]>("/categories").then((r) => r.data),
};

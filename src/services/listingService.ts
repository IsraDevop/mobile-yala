import { api } from "../api/client";
import type {
  CreateListingRequest,
  Image,
  Listing,
  PageResponse,
} from "../types";

export interface ListingFilters {
  category?: string;
  mode?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  page?: number;
  size?: number;
}

export const listingService = {
  findAll: (filters: ListingFilters = {}) => {
    const params = new URLSearchParams();
    params.set("page", String(filters.page ?? 0));
    params.set("size", String(filters.size ?? 10));
    if (filters.category) params.set("category", filters.category);
    if (filters.mode) params.set("mode", filters.mode);
    if (filters.condition) params.set("condition", filters.condition);
    if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
    if (filters.q) params.set("q", filters.q);
    return api
      .get<PageResponse<Listing>>(`/listings?${params.toString()}`)
      .then((r) => r.data);
  },

  findById: (id: number, signal?: AbortSignal) =>
    api.get<Listing>(`/listings/${id}`, { signal }).then((r) => r.data),

  create: (data: CreateListingRequest) =>
    api.post<Listing>("/listings", data).then((r) => r.data),

  update: (id: number, data: Partial<CreateListingRequest>) =>
    api.put<Listing>(`/listings/${id}`, data).then((r) => r.data),

  cancel: (id: number) =>
    api.delete(`/listings/${id}`),

  getImages: (listingId: number) =>
    api.get<Image[]>(`/listings/${listingId}/images`).then((r) => r.data),

  uploadImage: (listingId: number, file: { uri: string; name: string; type: string }, sortOrder?: number) => {
    const form = new FormData();
    form.append("file", { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
    const url = `/listings/${listingId}/images${sortOrder != null ? `?sortOrder=${sortOrder}` : ""}`;
    return api
      .post<Image>(url, form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },

  deleteImage: (imageId: number) =>
    api.delete(`/images/${imageId}`),
};

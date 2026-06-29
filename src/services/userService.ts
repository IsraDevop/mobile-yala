import { api } from "../api/client";
import type { Listing, PageResponse, SellerStoreInfo, User } from "../types";

export const userService = {
  getById: (id: number) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),

  getListingsByUser: (id: number, page = 0, size = 10) =>
    api
      .get<PageResponse<Listing>>(
        `/users/${id}/listings?page=${page}&size=${size}`
      )
      .then((r) => r.data),

  getStore: (id: number) =>
    api.get<SellerStoreInfo>(`/users/${id}/store`).then((r) => r.data),
};

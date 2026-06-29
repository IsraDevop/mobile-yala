import { api } from "../api/client";
import type { SellerApplication, SellerApplyRequest } from "../types";

export const sellerService = {
  apply: (data: SellerApplyRequest) =>
    api.post<SellerApplication>("/seller/application", data).then((r) => r.data),

  getMyApplication: () =>
    api.get<SellerApplication>("/seller/application/me").then((r) => r.data),
};

import { api } from "../api/client";
import type { Auction, CreateAuctionRequest, PageResponse } from "../types";

export const auctionService = {
  findAllActive: (page = 0, size = 10) =>
    api
      .get<PageResponse<Auction>>(`/auctions?page=${page}&size=${size}`)
      .then((r) => r.data),

  findById: (id: number, signal?: AbortSignal) =>
    api.get<Auction>(`/auctions/${id}`, { signal }).then((r) => r.data),

  create: (data: CreateAuctionRequest) =>
    api.post<Auction>("/auctions", data).then((r) => r.data),
};

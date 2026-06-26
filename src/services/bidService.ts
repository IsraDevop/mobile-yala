import { api } from "../api/client";
import type { Bid, PageResponse, PlaceBidRequest } from "../types";

export const bidService = {
  place: (data: PlaceBidRequest) =>
    api.post<Bid>("/bids", data).then((r) => r.data),

  findByAuction: (auctionId: number, page = 0, size = 20) =>
    api
      .get<PageResponse<Bid>>(
        `/bids/auction/${auctionId}?page=${page}&size=${size}`
      )
      .then((r) => r.data),

  findHighest: (auctionId: number) =>
    api.get<Bid>(`/bids/auction/${auctionId}/highest`).then((r) => r.data),
};

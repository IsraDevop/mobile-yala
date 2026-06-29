import { api } from "../api/client";
import type {
  CreateFlashAuctionRequest,
  FlashAuction,
  LiveComment,
  LiveDetail,
  LiveSummary,
  LiveToken,
  PageResponse,
  PlaceLiveBidRequest,
  PostLiveCommentRequest,
  StartLiveRequest,
} from "../types";

export const liveService = {
  list: (page = 0, size = 12) =>
    api.get<PageResponse<LiveSummary>>(`/live?page=${page}&size=${size}`).then((r) => r.data),

  findById: (id: number) =>
    api.get<LiveDetail>(`/live/${id}`).then((r) => r.data),

  getWatchToken: (id: number) =>
    api.post<LiveToken>(`/live/${id}/watch-token`).then((r) => r.data),

  start: (data: StartLiveRequest) =>
    api.post<LiveToken>("/live", data).then((r) => r.data),

  end: (id: number) =>
    api.post<void>(`/live/${id}/end`).then((r) => r.data),

  createAuction: (id: number, data: CreateFlashAuctionRequest) =>
    api.post<FlashAuction>(`/live/${id}/auctions`, data).then((r) => r.data),

  closeAuction: (auctionId: number) =>
    api.post<FlashAuction>(`/live/auctions/${auctionId}/close`).then((r) => r.data),

  placeBid: (auctionId: number, data: PlaceLiveBidRequest) =>
    api.post<void>(`/live/auctions/${auctionId}/bids`, data).then((r) => r.data),

  listBids: (auctionId: number, page = 0, size = 20) =>
    api.get(`/live/auctions/${auctionId}/bids?page=${page}&size=${size}`).then((r) => r.data),

  listComments: (id: number, size = 30) =>
    api.get<PageResponse<LiveComment>>(`/live/${id}/comments?page=0&size=${size}&sort=createdAt,desc`).then((r) => r.data),

  postComment: (id: number, data: PostLiveCommentRequest) =>
    api.post<LiveComment>(`/live/${id}/comments`, data).then((r) => r.data),

  // AI summary of the live comments — host only; not broadcast to viewers.
  summarizeComments: (id: number, limit = 80) =>
    api.post<{ summary: string }>(`/live/${id}/comments/summary?limit=${limit}`).then((r) => r.data),
};

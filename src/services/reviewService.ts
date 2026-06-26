import { api } from "../api/client";
import type { CreateReviewRequest, PageResponse, Review } from "../types";

export const reviewService = {
  create: (data: CreateReviewRequest) =>
    api.post<Review>("/reviews", data).then((r) => r.data),

  findByRecipient: (recipientId: number, page = 0, size = 10) =>
    api
      .get<PageResponse<Review>>(
        `/reviews/user/${recipientId}?page=${page}&size=${size}`
      )
      .then((r) => r.data),
};

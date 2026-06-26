import { api } from "../api/client";
import type { Notification, PageResponse } from "../types";

export const notificationService = {
  findMine: (page = 0, size = 20) =>
    api
      .get<PageResponse<Notification>>(`/notifications?page=${page}&size=${size}`)
      .then((r) => r.data),

  getUnreadCount: () =>
    api
      .get<Record<string, number>>("/notifications/unread-count")
      .then((r) => r.data["count"] ?? 0),

  markAsRead: (id: number) =>
    api.put<Notification>(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    api.put<Record<string, number>>("/notifications/read-all").then((r) => r.data),
};

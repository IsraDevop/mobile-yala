import { api } from "../api/client";
import type { CreateOrderRequest, Order, PageResponse } from "../types";

export const orderService = {
  create: (data: CreateOrderRequest) =>
    api.post<Order>("/orders", data).then((r) => r.data),

  findMyOrders: (page = 0, size = 10) =>
    api
      .get<PageResponse<Order>>(`/orders/my-orders?page=${page}&size=${size}`)
      .then((r) => r.data),

  findById: (id: number) =>
    api.get<Order>(`/orders/${id}`).then((r) => r.data),

  confirm: (id: number) =>
    api.put<Order>(`/orders/${id}/confirm`).then((r) => r.data),

  cancel: (id: number) =>
    api.put<Order>(`/orders/${id}/cancel`).then((r) => r.data),
};

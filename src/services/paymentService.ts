import { api } from "../api/client";
import type { PaymentPreferenceRequest, PaymentPreferenceResponse } from "../types";

export const paymentService = {
  createPreference: (data: PaymentPreferenceRequest) =>
    api.post<PaymentPreferenceResponse>("/payments/preference", data).then((r) => r.data),
};

import { Client, type StompSubscription } from "@stomp/stompjs";
import { tokenStorage } from "../api/storage";
import type { FlashAuction, LiveComment, LiveUpdateMessage } from "../types";

const WS_URL =
  process.env.EXPO_PUBLIC_WS_URL ?? "wss://yala.dpdns.org/ws/websocket";

let client: Client | null = null;

async function getClient(): Promise<Client> {
  if (client && client.active) return client;

  const token = await tokenStorage.getAccessToken();
  const connectHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  client = new Client({
    brokerURL: WS_URL,
    connectHeaders,
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });

  await new Promise<void>((resolve, reject) => {
    client!.onConnect = () => resolve();
    client!.onStompError = (frame) => reject(new Error(frame.headers["message"]));
    client!.activate();
  });

  return client;
}

export function disconnectLiveSocket(): void {
  if (client) {
    client.deactivate();
    client = null;
  }
}

export async function subscribeLive(
  streamId: number,
  cb: (msg: LiveUpdateMessage & { auction: FlashAuction | null }) => void
): Promise<() => void> {
  const c = await getClient();
  const sub: StompSubscription = c.subscribe(
    `/topic/live/${streamId}`,
    (frame) => {
      try {
        cb(JSON.parse(frame.body));
      } catch {}
    }
  );
  return () => sub.unsubscribe();
}

export async function subscribeLiveChat(
  streamId: number,
  cb: (msg: LiveComment) => void
): Promise<() => void> {
  const c = await getClient();
  const sub: StompSubscription = c.subscribe(
    `/topic/live/${streamId}/chat`,
    (frame) => {
      try {
        cb(JSON.parse(frame.body));
      } catch {}
    }
  );
  return () => sub.unsubscribe();
}

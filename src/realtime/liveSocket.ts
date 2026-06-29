import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { tokenStorage } from "../api/storage";
import type { FlashAuction, LiveComment, LiveUpdateMessage } from "../types";

const WS_URL =
  process.env.EXPO_PUBLIC_WS_URL ?? "wss://yala.dpdns.org/ws/websocket";

type Listener = (payload: any) => void;

interface TopicEntry {
  callbacks: Set<Listener>;
  sub: StompSubscription | null;
}

let client: Client | null = null;
let clientPromise: Promise<Client> | null = null;
const topics = new Map<string, TopicEntry>();

// Attach the STOMP subscription for a topic, but only once the socket is actually connected.
// If it isn't connected yet, onConnect re-opens every known topic — so callers never subscribe
// against a dead connection.
function openSubscription(topic: string, entry: TopicEntry): void {
  if (!client || !client.connected || entry.sub) return;
  entry.sub = client.subscribe(topic, (message: IMessage) => {
    let payload: any = null;
    try {
      payload = JSON.parse(message.body);
    } catch {
      payload = null;
    }
    entry.callbacks.forEach((cb) => cb(payload));
  });
}

// Lazily create + activate a single shared STOMP client. Concurrent callers share the same
// promise, so we never spin up two clients (the old code's race that threw
// "no underlying STOMP connection"). We resolve as soon as the client is activated — we do NOT
// await the CONNECT frame, so a failing socket can never hang the await forever.
function ensureClient(): Promise<Client> {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const token = await tokenStorage.getAccessToken();
    const c = new Client({
      brokerURL: WS_URL,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // @stomp/stompjs does NOT auto-resubscribe after a reconnect, so re-open every known
      // subscription each time the connection (re)comes up.
      onConnect: () => {
        topics.forEach((entry, topic) => {
          entry.sub = null;
          openSubscription(topic, entry);
        });
      },
      onStompError: (frame) =>
        console.warn("[liveSocket] STOMP error:", frame.headers["message"]),
      onWebSocketError: (e: any) =>
        console.warn("[liveSocket] WebSocket error:", e?.message ?? e),
    });
    client = c;
    c.activate();
    return c;
  })();
  return clientPromise;
}

function subscribe(topic: string, cb: Listener): () => void {
  let entry = topics.get(topic);
  if (!entry) {
    entry = { callbacks: new Set(), sub: null };
    topics.set(topic, entry);
  }
  entry.callbacks.add(cb);
  openSubscription(topic, entry); // attaches now if connected; otherwise onConnect will

  return () => {
    const current = topics.get(topic);
    if (!current) return;
    current.callbacks.delete(cb);
    if (current.callbacks.size === 0) {
      try {
        current.sub?.unsubscribe();
      } catch {
        /* already gone */
      }
      topics.delete(topic);
    }
  };
}

export function disconnectLiveSocket(): void {
  topics.clear();
  if (client) {
    client.deactivate();
    client = null;
  }
  clientPromise = null;
}

export async function subscribeLive(
  streamId: number,
  cb: (msg: LiveUpdateMessage & { auction: FlashAuction | null }) => void
): Promise<() => void> {
  await ensureClient();
  return subscribe(`/topic/live/${streamId}`, cb as Listener);
}

export async function subscribeLiveChat(
  streamId: number,
  cb: (msg: LiveComment) => void
): Promise<() => void> {
  await ensureClient();
  return subscribe(`/topic/live/${streamId}/chat`, cb as Listener);
}

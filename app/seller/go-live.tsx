import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { liveService } from "../../src/services/liveService";
import { subscribeLive, subscribeLiveChat } from "../../src/realtime/liveSocket";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { Loader } from "../../src/components/Loader";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { isLiveKitAvailable } from "../../src/utils/liveKit";
import { palette, fonts } from "../../src/theme/theme";
import type { FlashAuction, LiveComment, LiveToken } from "../../src/types";

const lkAvailable = isLiveKitAvailable();

function HostStage({ streamId }: { streamId: number }) {
  const { useTracks, VideoTrack } = require("@livekit/react-native");
  const { Track } = require("livekit-client");

  const tracks: any[] = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: false }],
    { onlySubscribed: false }
  );
  const cam = tracks.find((t: any) => t.publication?.kind === "video");

  return (
    <View style={styles.stageContainer}>
      {cam ? (
        <VideoTrack trackRef={cam} style={styles.stageContainer} objectFit="cover" mirror />
      ) : (
        <View style={[styles.stageContainer, styles.stagePlaceholder]}>
          <Ionicons name="videocam-outline" size={40} color="#fff" />
          <Text style={styles.stageText}>Iniciando cámara…</Text>
        </View>
      )}
    </View>
  );
}

export default function GoLiveScreen() {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [lkToken, setLkToken] = useState<LiveToken | null>(null);
  const [streamId, setStreamId] = useState<number | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [auction, setAuction] = useState<FlashAuction | null>(null);
  const [auctionTitle, setAuctionTitle] = useState("");
  const [auctionBase, setAuctionBase] = useState("");
  const [auctionLoading, setAuctionLoading] = useState(false);
  const [auctionError, setAuctionError] = useState<string | null>(null);
  const [endLoading, setEndLoading] = useState(false);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);
  const chatUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      unsubRef.current?.();
      chatUnsubRef.current?.();
    };
  }, []);

  if (!user?.isVerifiedSeller) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Salir en vivo" />
        <View style={styles.gateContainer}>
          <Ionicons name="lock-closed-outline" size={40} color={palette.textTertiary} />
          <Text style={styles.gateTitle}>Solo para vendedores verificados</Text>
          <Text style={styles.gateSubtitle}>Completa tu solicitud de vendedor para transmitir.</Text>
          <PrimaryButton label="Ir a mi solicitud" onPress={() => router.push("/seller/apply")} />
        </View>
      </View>
    );
  }

  if (!lkAvailable) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Salir en vivo" />
        <View style={styles.gateContainer}>
          <Ionicons name="phone-portrait-outline" size={40} color={palette.textTertiary} />
          <Text style={styles.gateTitle}>Necesitas la app de desarrollo</Text>
          <Text style={styles.gateSubtitle}>
            El video nativo solo está disponible en el dev build de Expo. Puedes transmitir desde la web de Yala.
          </Text>
          <PrimaryButton
            label="Ir a la web"
            onPress={() => {
              const { Linking } = require("react-native");
              Linking.openURL("https://yala.dpdns.org/seller/go-live");
            }}
          />
        </View>
      </View>
    );
  }

  const handleStart = async () => {
    if (!title.trim()) {
      setStartError("Escribe un título para el live.");
      return;
    }
    setStartError(null);
    setStartLoading(true);
    try {
      const tk = await liveService.start({ title: title.trim() });
      setLkToken(tk);
      setStreamId(tk.streamId);
      setStreaming(true);
      const unsub = await subscribeLive(tk.streamId, (msg) => {
        if (msg.auction) setAuction(msg.auction);
        if (msg.type === "LIVE_ENDED") setStreaming(false);
      });
      unsubRef.current = unsub;
      liveService.listComments(tk.streamId, 30)
        .then((p) => setComments([...(p.content || [])].reverse()))
        .catch(() => {});
      chatUnsubRef.current = await subscribeLiveChat(tk.streamId, (c) =>
        setComments((prev) => [...prev, c])
      );
    } catch (e) {
      setStartError(getApiErrorMessage(e));
    } finally {
      setStartLoading(false);
    }
  };

  const sendComment = useCallback(async () => {
    const text = commentText.trim();
    if (!streamId || !text || posting) return;
    setPosting(true);
    try {
      await liveService.postComment(streamId, { text });
      setCommentText("");
    } catch {
      // the comment just won't post; keep the text so the host can retry
    } finally {
      setPosting(false);
    }
  }, [streamId, commentText, posting]);

  const runSummary = useCallback(async () => {
    if (!streamId || summarizing) return;
    setSummarizing(true);
    try {
      const r = await liveService.summarizeComments(streamId, 80);
      setSummary(r?.summary || "Sin resumen.");
    } catch (e) {
      setSummary(getApiErrorMessage(e));
    } finally {
      setSummarizing(false);
    }
  }, [streamId, summarizing]);

  const handleCreateAuction = useCallback(async () => {
    if (!streamId || !auctionTitle.trim()) {
      setAuctionError("Escribe el título de la subasta.");
      return;
    }
    const base = parseFloat(auctionBase.replace(",", "."));
    if (isNaN(base) || base <= 0) {
      setAuctionError("El precio base debe ser mayor a 0.");
      return;
    }
    setAuctionError(null);
    setAuctionLoading(true);
    try {
      const created = await liveService.createAuction(streamId, {
        title: auctionTitle.trim(),
        basePrice: base,
        bidIncrement: 1,
      });
      setAuction(created);
      setAuctionTitle("");
      setAuctionBase("");
    } catch (e) {
      setAuctionError(getApiErrorMessage(e));
    } finally {
      setAuctionLoading(false);
    }
  }, [streamId, auctionTitle, auctionBase]);

  const handleCloseAuction = useCallback(async () => {
    if (!auction) return;
    setAuctionLoading(true);
    try {
      const closed = await liveService.closeAuction(auction.id);
      setAuction(closed);
    } catch (e) {
      setAuctionError(getApiErrorMessage(e));
    } finally {
      setAuctionLoading(false);
    }
  }, [auction]);

  const handleEnd = async () => {
    if (!streamId) return;
    setEndLoading(true);
    try {
      await liveService.end(streamId);
      unsubRef.current?.();
      chatUnsubRef.current?.();
      router.back();
    } catch (e) {
      setEndLoading(false);
    }
  };

  if (!streaming || !lkToken) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Salir en vivo" />
        <View style={styles.setupContainer}>
          <Ionicons name="radio-outline" size={36} color={palette.primary} />
          <Text style={styles.setupTitle}>Configurar transmisión</Text>
          <Text style={styles.setupLabel}>Título del live</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej. Unboxing de Pokémon TCG"
            placeholderTextColor={palette.textTertiary}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
          {startError && <Text style={styles.errorText}>{startError}</Text>}
          <PrimaryButton
            label={startLoading ? "Iniciando…" : "Comenzar live"}
            onPress={handleStart}
          />
        </View>
      </View>
    );
  }

  const { LiveKitRoom, AudioSession } = require("@livekit/react-native");

  const auctionActive = auction?.status === "ACTIVE";

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenHeader title="Transmitiendo en vivo" />

      <LiveKitRoom
        serverUrl={lkToken.url}
        token={lkToken.token}
        connect
        audio
        video
        onConnected={() => AudioSession.startAudioSession()}
      >
        <HostStage streamId={streamId!} />
      </LiveKitRoom>

      <View style={styles.controls}>
        {!auctionActive ? (
          <View style={styles.auctionForm}>
            <Text style={styles.sectionTitle}>Nueva subasta flash</Text>
            <TextInput
              style={styles.input}
              value={auctionTitle}
              onChangeText={setAuctionTitle}
              placeholder="Título del artículo"
              placeholderTextColor={palette.textTertiary}
            />
            <TextInput
              style={styles.input}
              value={auctionBase}
              onChangeText={setAuctionBase}
              placeholder="Precio base (S/.)"
              placeholderTextColor={palette.textTertiary}
              keyboardType="decimal-pad"
            />
            {auctionError && <Text style={styles.errorText}>{auctionError}</Text>}
            <TouchableOpacity
              style={[styles.actionBtn, styles.auctionBtn, auctionLoading && styles.btnDisabled]}
              onPress={handleCreateAuction}
              disabled={auctionLoading}
            >
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>{auctionLoading ? "Iniciando…" : "Iniciar subasta"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activeAuction}>
            <Text style={styles.sectionTitle}>Subasta activa</Text>
            <Text numberOfLines={1} style={styles.activeAuctionTitle}>{auction!.title}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.activePrice}>
                S/. {(auction!.currentPrice ?? auction!.basePrice).toFixed(2)}
              </Text>
              <Text style={styles.activeBids}>{auction!.totalBids} puja{auction!.totalBids !== 1 ? "s" : ""}</Text>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, styles.closeAuctionBtn, auctionLoading && styles.btnDisabled]}
              onPress={handleCloseAuction}
              disabled={auctionLoading}
            >
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>{auctionLoading ? "Cerrando…" : "Cerrar subasta"}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.chatPanel}>
          <View style={styles.chatHd}>
            <Text style={styles.sectionTitle}>Chat en vivo</Text>
            <TouchableOpacity style={styles.iaBtn} onPress={runSummary} disabled={summarizing}>
              <Ionicons name="sparkles-outline" size={14} color={palette.primary} />
              <Text style={styles.iaBtnText}>{summarizing ? "Resumiendo…" : "Resumir con IA"}</Text>
            </TouchableOpacity>
          </View>
          {summary ? <Text style={styles.summaryText}>{summary}</Text> : null}
          <FlatList
            data={comments}
            keyExtractor={(c) => String(c.id)}
            style={styles.chatList}
            renderItem={({ item }) => (
              <Text style={styles.chatMsg}>
                <Text style={styles.chatUser}>{item.userName}: </Text>
                {item.text}
              </Text>
            )}
            ListEmptyComponent={<Text style={styles.chatEmpty}>Aún no hay comentarios.</Text>}
          />
          <View style={styles.chatInputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Escribe un mensaje…"
              placeholderTextColor={palette.textTertiary}
              onSubmitEditing={sendComment}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.chatSend} onPress={sendComment} disabled={posting}>
              <Ionicons name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, styles.endBtn, endLoading && styles.btnDisabled]}
          onPress={handleEnd}
          disabled={endLoading}
        >
          <Ionicons name="stop-circle-outline" size={16} color="#fff" />
          <Text style={styles.actionBtnText}>{endLoading ? "Terminando…" : "Terminar live"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  gateContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 14 },
  gateTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: palette.textPrimary, textAlign: "center" },
  gateSubtitle: { fontFamily: fonts.regular, fontSize: 14, color: palette.textSecondary, textAlign: "center" },
  setupContainer: { flex: 1, padding: 24, gap: 12, justifyContent: "center" },
  setupTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: palette.textPrimary, marginTop: 8 },
  setupLabel: { fontFamily: fonts.semibold, fontSize: 14, color: palette.textSecondary, marginTop: 8 },
  stageContainer: { width: "100%", height: 220 },
  stagePlaceholder: { backgroundColor: palette.primary, justifyContent: "center", alignItems: "center", gap: 8 },
  stageText: { color: "#fff", fontFamily: fonts.regular, fontSize: 13 },
  controls: { padding: 16, gap: 12 },
  chatPanel: { backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: palette.borderLight, gap: 8 },
  chatHd: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iaBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: palette.primaryContainer },
  iaBtnText: { fontFamily: fonts.bold, fontSize: 12, color: palette.primary },
  summaryText: { fontFamily: fonts.regular, fontSize: 13, color: palette.textSecondary, lineHeight: 18, backgroundColor: palette.background, borderRadius: 10, padding: 10 },
  chatList: { maxHeight: 150 },
  chatMsg: { fontFamily: fonts.regular, fontSize: 13, color: palette.textPrimary, marginBottom: 6, lineHeight: 18 },
  chatUser: { fontFamily: fonts.bold, color: palette.textPrimary },
  chatEmpty: { fontFamily: fonts.regular, fontSize: 12, color: palette.textTertiary, paddingVertical: 8 },
  chatInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  chatSend: { width: 42, height: 42, borderRadius: 12, backgroundColor: palette.primary, justifyContent: "center", alignItems: "center" },
  auctionForm: { gap: 10 },
  activeAuction: { gap: 8, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: palette.borderLight },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 14, color: palette.textPrimary },
  activeAuctionTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: palette.textPrimary },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  activePrice: { fontFamily: fonts.monoExtra, fontSize: 20, color: palette.primary },
  activeBids: { fontFamily: fonts.regular, fontSize: 12, color: palette.textTertiary },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: palette.textPrimary,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 13,
  },
  auctionBtn: { backgroundColor: palette.secondary },
  closeAuctionBtn: { backgroundColor: palette.warning },
  endBtn: { backgroundColor: palette.error },
  btnDisabled: { opacity: 0.6 },
  actionBtnText: { color: "#fff", fontFamily: fonts.bold, fontSize: 15 },
  errorText: { fontFamily: fonts.regular, fontSize: 12, color: palette.error },
});

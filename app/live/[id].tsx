import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { liveService } from "../../src/services/liveService";
import { subscribeLive, subscribeLiveChat } from "../../src/realtime/liveSocket";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { Loader } from "../../src/components/Loader";
import { ErrorView } from "../../src/components/ErrorView";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { isLiveKitAvailable } from "../../src/utils/liveKit";
import { palette, fonts } from "../../src/theme/theme";
import type { FlashAuction, LiveComment, LiveDetail, LiveToken } from "../../src/types";

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || "https://yala.dpdns.org";
const lkAvailable = isLiveKitAvailable();

function VideoStage() {
  const { useTracks, VideoTrack } = require("@livekit/react-native");
  const { Track } = require("livekit-client");
  const tracks: any[] = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare],
    { onlySubscribed: true }
  );
  const cam = tracks.find((t: any) => t.publication?.kind === "video");
  return (
    <View style={styles.stageContainer}>
      {cam ? (
        <VideoTrack trackRef={cam} style={styles.stageContainer} objectFit="cover" />
      ) : (
        <View style={[styles.stageContainer, styles.videoPlaceholder]}>
          <Ionicons name="videocam-outline" size={36} color="#fff" />
          <Text style={styles.waitingText}>Esperando el video del vendedor…</Text>
        </View>
      )}
    </View>
  );
}

function NativePlayer({ serverUrl, token, onEnded }: { serverUrl: string; token: string; onEnded: () => void }) {
  const { LiveKitRoom, AudioSession } = require("@livekit/react-native");
  const connectedRef = useRef(false);

  useEffect(() => {
    AudioSession.startAudioSession();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect
      audio={false}
      video={false}
      onConnected={() => { connectedRef.current = true; }}
      onDisconnected={() => { if (connectedRef.current) onEnded(); }}
    >
      <VideoStage />
    </LiveKitRoom>
  );
}

export default function LiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const numId = Number(id);

  const [live, setLive] = useState<LiveDetail | null>(null);
  const [lkToken, setLkToken] = useState<LiveToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auction, setAuction] = useState<FlashAuction | null>(null);
  const [ended, setEnded] = useState(false);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [bidInput, setBidInput] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const chatRef = useRef<FlatList>(null);
  const unsubRefs = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!numId) return;
    const init = async () => {
      try {
        setLoading(true);
        const [liveData, commentsPage] = await Promise.all([
          liveService.findById(numId),
          liveService.listComments(numId, 30),
        ]);
        setLive(liveData);
        setAuction(liveData.activeAuction);
        setEnded(liveData.status === "ENDED");
        setComments([...commentsPage.content].reverse());
        if (lkAvailable) {
          const tk = await liveService.getWatchToken(numId);
          setLkToken(tk);
        }
      } catch (e) {
        setError(getApiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [numId]);

  useEffect(() => {
    if (!numId) return;
    let mounted = true;
    const setupStomp = async () => {
      try {
        const unsubLive = await subscribeLive(numId, (msg) => {
          if (!mounted) return;
          if (msg.type === "LIVE_ENDED") {
            setEnded(true);
            setAuction(null);
          } else if (msg.auction) {
            setAuction(msg.auction);
          }
        });
        const unsubChat = await subscribeLiveChat(numId, (c) => {
          if (!mounted) return;
          setComments((prev) => [...prev, c]);
        });
        unsubRefs.current = [unsubLive, unsubChat];
      } catch {}
    };
    setupStomp();
    return () => {
      mounted = false;
      unsubRefs.current.forEach((fn) => fn());
      unsubRefs.current = [];
    };
  }, [numId]);

  const handleComment = useCallback(async () => {
    if (!chatInput.trim() || commentLoading) return;
    Keyboard.dismiss();
    setCommentLoading(true);
    try {
      await liveService.postComment(numId, { text: chatInput.trim() });
      setChatInput("");
    } catch {}
    finally { setCommentLoading(false); }
  }, [chatInput, commentLoading, numId]);

  const minNext = auction
    ? (auction.currentPrice == null ? auction.basePrice : auction.currentPrice + auction.bidIncrement)
    : 0;

  const handleBid = useCallback(async () => {
    if (bidLoading || !auction) return;
    setBidError(null);
    const amount = parseFloat(bidInput.replace(",", "."));
    if (isNaN(amount) || amount < minNext) {
      setBidError(`El mínimo es S/. ${minNext.toFixed(2)}`);
      return;
    }
    setBidLoading(true);
    try {
      await liveService.placeBid(auction.id, { amount });
      setBidInput("");
    } catch (e: any) {
      if (e?.response?.status === 409) {
        setBidError("Te ganaron. Sube tu puja.");
      } else {
        setBidError(getApiErrorMessage(e));
      }
    } finally {
      setBidLoading(false);
    }
  }, [bidLoading, auction, bidInput, minNext]);

  if (loading) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Transmisión" />
        <Loader />
      </View>
    );
  }

  if (error || !live) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Transmisión" />
        <ErrorView message={error ?? "No encontramos la transmisión."} />
      </View>
    );
  }

  const isAuth = !!user;
  const canBid = isAuth && !!user?.isIdentityVerified;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader title="Transmisión en vivo" />

      <View style={styles.videoContainer}>
        {ended ? (
          <View style={[styles.stageContainer, styles.videoPlaceholder]}>
            <Ionicons name="checkmark-done-circle-outline" size={40} color="#fff" />
            <Text style={styles.waitingText}>La transmisión finalizó.</Text>
          </View>
        ) : lkAvailable && lkToken ? (
          <NativePlayer serverUrl={lkToken.url} token={lkToken.token} onEnded={() => setEnded(true)} />
        ) : (
          <View style={styles.videoFallback}>
            {live.coverImageUrl ? (
              <Image source={{ uri: live.coverImageUrl }} style={styles.coverImg} />
            ) : (
              <View style={[styles.coverImg, styles.videoPlaceholder]}>
                <Ionicons name="videocam" size={40} color="#fff" />
              </View>
            )}
            <TouchableOpacity
              style={styles.webBtn}
              onPress={() => Linking.openURL(`${WEB_URL}/live/${live.id}`)}
            >
              <Ionicons name="globe-outline" size={15} color="#fff" />
              <Text style={styles.webBtnText}>Ver en la web</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={[styles.liveBadge, ended && styles.endedBadge]}>
          <View style={[styles.liveDot, ended && styles.liveDotEnded]} />
          <Text style={styles.liveBadgeText}>{ended ? "Terminó" : "En vivo"}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text numberOfLines={1} style={styles.liveTitle}>{live.title}</Text>
        {live.seller && <Text style={styles.sellerName}>{live.seller.name}</Text>}
      </View>

      {auction && !ended && (
        <View style={styles.auctionPanel}>
          <Text style={styles.auctionLabel}>SUBASTA FLASH</Text>
          <Text numberOfLines={1} style={styles.auctionTitle}>{auction.title}</Text>
          <View style={styles.auctionPriceRow}>
            <Text style={styles.auctionPrice}>
              S/. {(auction.currentPrice ?? auction.basePrice).toFixed(2)}
            </Text>
            <Text style={styles.auctionBids}>
              {auction.totalBids} puja{auction.totalBids !== 1 ? "s" : ""}
            </Text>
          </View>
          {canBid ? (
            <View style={styles.bidRow}>
              <TextInput
                style={styles.bidInput}
                value={bidInput}
                onChangeText={setBidInput}
                placeholder={`Mín. S/. ${minNext.toFixed(2)}`}
                placeholderTextColor={palette.textTertiary}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.bidBtn, bidLoading && styles.bidBtnDisabled]}
                onPress={handleBid}
                disabled={bidLoading}
              >
                <Text style={styles.bidBtnText}>{bidLoading ? "…" : "Pujar"}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.gateText}>
              {!isAuth ? "Inicia sesión para pujar." : "Verifica tu identidad para pujar."}
            </Text>
          )}
          {bidError && <Text style={styles.errorText}>{bidError}</Text>}
        </View>
      )}

      <FlatList
        ref={chatRef}
        data={comments}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.chatMsg}>
            <Text style={styles.chatUser}>{item.userName ?? "Anónimo"}</Text>
            <Text style={styles.chatText}> {item.text}</Text>
          </View>
        )}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <Text style={styles.chatEmpty}>El chat aparecerá aquí durante el live.</Text>
        }
      />

      {isAuth ? (
        <View style={styles.commentBar}>
          <TextInput
            style={styles.commentInput}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Escribe un comentario…"
            placeholderTextColor={palette.textTertiary}
            returnKeyType="send"
            onSubmitEditing={handleComment}
          />
          <TouchableOpacity
            onPress={handleComment}
            disabled={commentLoading || !chatInput.trim()}
            style={styles.sendBtn}
          >
            <Ionicons
              name="send"
              size={18}
              color={chatInput.trim() ? palette.primary : palette.textTertiary}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.commentGate}>
          <Text style={styles.gateText}>Inicia sesión para participar en el chat.</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  videoContainer: { position: "relative", backgroundColor: palette.dark },
  stageContainer: { width: "100%", height: 210 },
  videoFallback: { width: "100%", height: 210, position: "relative" },
  coverImg: { width: "100%", height: 210, resizeMode: "cover" },
  videoPlaceholder: { backgroundColor: palette.primary, justifyContent: "center", alignItems: "center", gap: 8 },
  waitingText: { color: "#fff", fontFamily: fonts.regular, fontSize: 13 },
  webBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  webBtnText: { color: "#fff", fontFamily: fonts.semibold, fontSize: 13 },
  liveBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: palette.secondary,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  endedBadge: { backgroundColor: palette.textSecondary },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveDotEnded: { backgroundColor: "#ddd" },
  liveBadgeText: { color: "#fff", fontFamily: fonts.bold, fontSize: 10, textTransform: "uppercase" },
  infoRow: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff", gap: 2 },
  liveTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: palette.textPrimary },
  sellerName: { fontFamily: fonts.regular, fontSize: 13, color: palette.textSecondary },
  auctionPanel: {
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.borderLight,
    padding: 14,
    gap: 6,
  },
  auctionLabel: { fontFamily: fonts.mono, fontSize: 10, color: palette.secondary, letterSpacing: 0.5 },
  auctionTitle: { fontFamily: fonts.bold, fontSize: 14, color: palette.textPrimary },
  auctionPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  auctionPrice: { fontFamily: fonts.monoExtra, fontSize: 20, color: palette.primary },
  auctionBids: { fontFamily: fonts.regular, fontSize: 12, color: palette.textTertiary },
  bidRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  bidInput: {
    flex: 1,
    backgroundColor: palette.fill,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: palette.textPrimary,
  },
  bidBtn: {
    backgroundColor: palette.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
    justifyContent: "center",
  },
  bidBtnDisabled: { opacity: 0.6 },
  bidBtnText: { color: "#fff", fontFamily: fonts.bold, fontSize: 14 },
  gateText: { fontFamily: fonts.regular, fontSize: 12, color: palette.textSecondary, marginTop: 2 },
  errorText: { fontFamily: fonts.regular, fontSize: 12, color: palette.error, marginTop: 2 },
  chatList: { flex: 1 },
  chatContent: { padding: 14, gap: 6, flexGrow: 1 },
  chatMsg: { flexDirection: "row", flexWrap: "wrap", paddingVertical: 3 },
  chatUser: { fontFamily: fonts.bold, fontSize: 13, color: palette.primary },
  chatText: { fontFamily: fonts.regular, fontSize: 13, color: palette.textPrimary, flex: 1 },
  chatEmpty: {
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 13,
    color: palette.textTertiary,
    marginTop: 20,
  },
  commentBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: palette.borderLight,
  },
  commentInput: {
    flex: 1,
    backgroundColor: palette.fill,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: palette.textPrimary,
  },
  sendBtn: { padding: 4 },
  commentGate: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: palette.borderLight,
  },
});

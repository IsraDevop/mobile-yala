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
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { liveService } from "../../src/services/liveService";
import { subscribeLive, subscribeLiveChat } from "../../src/realtime/liveSocket";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { Loader } from "../../src/components/Loader";
import { ErrorView } from "../../src/components/ErrorView";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { mergeComments } from "../../src/utils/liveChat";
import { isLiveKitAvailable } from "../../src/utils/liveKit";
import { palette, fonts } from "../../src/theme/theme";
import type { FlashAuction, LiveComment, LiveDetail, LiveToken } from "../../src/types";

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || "https://yala.dpdns.org";
const lkAvailable = isLiveKitAvailable();

function VideoStage({ fullscreen = false }: { fullscreen?: boolean }) {
  const { useTracks, VideoTrack } = require("@livekit/react-native");
  const { Track } = require("livekit-client");
  const tracks: any[] = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare],
    { onlySubscribed: true }
  );
  const cam = tracks.find((t: any) => t.publication?.kind === "video");
  const containerStyle = fullscreen ? StyleSheet.absoluteFill : styles.stageContainer;
  return (
    <View style={containerStyle}>
      {cam ? (
        <VideoTrack trackRef={cam} style={containerStyle} objectFit="cover" />
      ) : (
        <View style={[containerStyle, styles.videoPlaceholder]}>
          <Ionicons name="videocam-outline" size={36} color="#fff" />
          <Text style={styles.waitingText}>Esperando el video del vendedor…</Text>
        </View>
      )}
    </View>
  );
}

function NativePlayer({
  serverUrl,
  token,
  onEnded,
  fullscreen = false,
}: {
  serverUrl: string;
  token: string;
  onEnded: () => void;
  fullscreen?: boolean;
}) {
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
      <VideoStage fullscreen={fullscreen} />
    </LiveKitRoom>
  );
}

export default function LiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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
  const [customMode, setCustomMode] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
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
        setComments((prev) => mergeComments(prev, commentsPage.content));
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
          setComments((prev) => mergeComments(prev, [c]));
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

  // Polling fallback: keep the chat feed fresh even if a realtime frame is missed.
  useEffect(() => {
    if (!numId || ended) return;
    const interval = setInterval(() => {
      liveService
        .listComments(numId, 30)
        .then((p) => setComments((prev) => mergeComments(prev, p.content)))
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [numId, ended]);

  // Polling fallback for live state: catches auction start/close missed by STOMP.
  useEffect(() => {
    if (!numId || ended) return;
    const interval = setInterval(async () => {
      try {
        const liveData = await liveService.findById(numId);
        if (liveData.status === "ENDED") {
          setEnded(true);
          setAuction(null);
        } else {
          setAuction(liveData.activeAuction);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [numId, ended]);

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = Keyboard.addListener(showEvt, (e) => setKeyboardOffset(e.endCoordinates.height));
    const onHide = Keyboard.addListener(hideEvt, () => setKeyboardOffset(0));
    return () => { onShow.remove(); onHide.remove(); };
  }, []);

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

  // If a new bid lands while customMode is open and the current value is now below the new minimum, re-seed.
  useEffect(() => {
    if (customMode) {
      const cur = parseFloat(bidInput.replace(",", "."));
      if (isNaN(cur) || cur < minNext) {
        setBidInput(String(minNext));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minNext]);

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
      setCustomMode(false);
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

  const handleQuickBid = useCallback(async () => {
    if (bidLoading || !auction) return;
    setBidError(null);
    setBidLoading(true);
    try {
      await liveService.placeBid(auction.id, { amount: minNext });
      setCustomMode(false);
    } catch (e: any) {
      if (e?.response?.status === 409) {
        setBidError("Te ganaron. Sube tu puja.");
      } else {
        setBidError(getApiErrorMessage(e));
      }
    } finally {
      setBidLoading(false);
    }
  }, [bidLoading, auction, minNext]);

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

  // Immersive (TikTok-style) layout when LiveKit video is available and the stream is active.
  const immersive = lkAvailable && !!lkToken && !ended;

  if (immersive) {
    return (
      <KeyboardAvoidingView
        style={styles.immersiveRoot}
        behavior={undefined}
      >
        {/* Full-screen video background */}
        <View style={StyleSheet.absoluteFill}>
          <NativePlayer
            serverUrl={lkToken!.url}
            token={lkToken!.token}
            onEnded={() => setEnded(true)}
            fullscreen
          />
        </View>

        {/* Top scrim: back button + live badge + title/seller */}
        <View style={[styles.topScrim, { paddingTop: insets.top + 8 }]}>
          <View style={styles.topScrimRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
            <View style={styles.immersiveLiveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>En vivo</Text>
            </View>
          </View>
          <Text numberOfLines={1} style={styles.immersiveTitle}>{live.title}</Text>
          {live.seller && (
            <Text style={styles.immersiveSeller}>{live.seller.name}</Text>
          )}
        </View>

        {/* Bottom overlay: chat + auction card + comment bar */}
        <View style={[styles.immersiveBottom, {
          bottom: keyboardOffset,
          paddingBottom: keyboardOffset > 0 ? 6 : insets.bottom + 6,
        }]}>
          {/* Last 5 chat messages overlaid (non-interactive) */}
          {comments.length > 0 && (
            <View style={styles.immersiveChatOverlay} pointerEvents="none">
              {comments.slice(-5).map((item) => {
                const isBid = item.id < 0;
                return (
                  <View key={item.id} style={styles.immersiveChatPill}>
                    <Text style={[styles.immersiveChatUser, isBid && styles.immersiveBidUser]}>
                      {item.userName ?? "Anónimo"}
                    </Text>
                    {isBid && (
                      <Ionicons
                        name="hammer"
                        size={11}
                        color={palette.secondary}
                        style={{ marginHorizontal: 3 }}
                      />
                    )}
                    <Text style={[styles.immersiveChatText, isBid && styles.immersiveBidText]}>
                      {" "}{item.text}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Floating auction card */}
          {auction && !ended && (
            <View style={styles.auctionCard}>
              <View style={styles.auctionCardHeader}>
                {live.coverImageUrl ? (
                  <Image source={{ uri: live.coverImageUrl }} style={styles.auctionThumb} />
                ) : (
                  <View style={[styles.auctionThumb, styles.auctionThumbPlaceholder]}>
                    <Ionicons name="pricetag" size={14} color={palette.primary} />
                  </View>
                )}
                <View style={styles.auctionInfo}>
                  <Text numberOfLines={1} style={styles.auctionCardTitle}>{auction.title}</Text>
                  <Text style={styles.auctionCardMeta}>
                    S/. {(auction.currentPrice ?? auction.basePrice).toFixed(2)}
                    {"  "}·{"  "}
                    {auction.totalBids} puja{auction.totalBids !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              {canBid ? (
                customMode ? (
                  <View style={styles.customBidRow}>
                    <TextInput
                      style={styles.customBidInput}
                      value={bidInput}
                      onChangeText={(t) => {
                        let v = t.replace(/[^\d.]/g, "");
                        if (Number(v) > 9999) v = "9999";
                        setBidInput(v);
                      }}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      autoFocus
                      placeholder={`Mín. S/. ${minNext.toFixed(2)}`}
                      placeholderTextColor={palette.textTertiary}
                    />
                    <TouchableOpacity
                      style={[styles.quickBidBtn, bidLoading && styles.bidBtnDisabled]}
                      onPress={handleBid}
                      disabled={bidLoading}
                    >
                      <Text style={styles.quickBidBtnText}>{bidLoading ? "…" : "Pujar"}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.whatnotRow}>
                    <TouchableOpacity
                      style={styles.customBtn}
                      onPress={() => { setCustomMode(true); setBidInput(String(minNext)); }}
                    >
                      <Text style={styles.customBtnText}>Personalizar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickBidBtn, styles.quickBidBtnWide, bidLoading && styles.bidBtnDisabled]}
                      onPress={handleQuickBid}
                      disabled={bidLoading}
                    >
                      <Ionicons name="flash" size={15} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={styles.quickBidBtnText}>
                        {bidLoading ? "…" : `Pujar  S/. ${minNext.toFixed(2)}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )
              ) : (
                <Text style={styles.gateText}>
                  {!isAuth ? "Inicia sesión para pujar." : "Verifica tu identidad para pujar."}
                </Text>
              )}
              {bidError && <Text style={styles.errorText}>{bidError}</Text>}
            </View>
          )}

          {/* Comment input bar */}
          {isAuth ? (
            <View style={styles.immersiveCommentBar}>
              <TextInput
                style={styles.immersiveCommentInput}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Escribe un comentario…"
                placeholderTextColor="rgba(255,255,255,0.5)"
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
                  color={chatInput.trim() ? "#fff" : "rgba(255,255,255,0.4)"}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.immersiveGate}>
              <Text style={styles.immersiveGateText}>Inicia sesión para participar en el chat.</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Fallback layout (Expo Go / LiveKit not available / stream ended) ──────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="padding"
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

      <FlatList
        ref={chatRef}
        data={comments}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <>
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
                      onChangeText={(t) => { let v = t.replace(/[^\d.]/g, ""); if (Number(v) > 9999) v = "9999"; setBidInput(v); }}
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
            <Text style={styles.chatHeading}>Chat en vivo</Text>
          </>
        }
        renderItem={({ item }) => {
          const isBid = item.id < 0;
          return (
            <View style={[styles.chatMsg, isBid && styles.chatBid]}>
              {isBid && <Ionicons name="hammer" size={13} color={palette.secondary} style={styles.chatBidIcon} />}
              <Text style={[styles.chatUser, isBid && styles.chatBidUser]}>{item.userName ?? "Anónimo"}</Text>
              <Text style={[styles.chatText, isBid && styles.chatBidText]}> {item.text}</Text>
            </View>
          );
        }}
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
  // ── Shared ───────────────────────────────────────────────────────────────────
  flex: { flex: 1, backgroundColor: palette.background },
  gateText: { fontFamily: fonts.regular, fontSize: 12, color: palette.textSecondary, marginTop: 2 },
  errorText: { fontFamily: fonts.regular, fontSize: 12, color: palette.error, marginTop: 2 },
  waitingText: { color: "#fff", fontFamily: fonts.regular, fontSize: 13 },
  sendBtn: { padding: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },

  // ── Fallback layout (Expo Go / ended) ────────────────────────────────────────
  videoContainer: { position: "relative", backgroundColor: palette.dark },
  stageContainer: { width: "100%", height: 210 },
  videoFallback: { width: "100%", height: 210, position: "relative" },
  coverImg: { width: "100%", height: 210, resizeMode: "cover" },
  videoPlaceholder: { backgroundColor: palette.primary, justifyContent: "center", alignItems: "center", gap: 8 },
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
  chatList: { flex: 1 },
  chatContent: { padding: 14, gap: 6, flexGrow: 1 },
  chatMsg: { flexDirection: "row", flexWrap: "wrap", paddingVertical: 3, alignItems: "center" },
  chatUser: { fontFamily: fonts.bold, fontSize: 13, color: palette.primary },
  chatText: { fontFamily: fonts.regular, fontSize: 13, color: palette.textPrimary, flex: 1 },
  chatHeading: { fontFamily: fonts.extrabold, fontSize: 13, color: palette.textSecondary, paddingTop: 8, paddingBottom: 2 },
  chatBid: { backgroundColor: palette.secondaryBg, borderRadius: 8, paddingHorizontal: 8 },
  chatBidIcon: { marginRight: 4 },
  chatBidUser: { color: palette.secondary },
  chatBidText: { fontFamily: fonts.bold, color: palette.secondary },
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
  commentGate: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: palette.borderLight,
  },

  // ── Immersive layout (TikTok-style) ──────────────────────────────────────────
  immersiveRoot: { flex: 1, backgroundColor: "#000" },

  topScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  topScrimRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  backBtn: { padding: 2 },
  immersiveLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: palette.secondary,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  immersiveTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: "#fff",
  },
  immersiveSeller: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },

  immersiveBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },

  immersiveChatOverlay: {
    width: "65%",
    gap: 4,
    paddingBottom: 4,
  },
  immersiveChatPill: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.38)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 2,
  },
  immersiveChatUser: { fontFamily: fonts.bold, fontSize: 13, color: "#fff" },
  immersiveChatText: { fontFamily: fonts.regular, fontSize: 13, color: "#fff" },
  immersiveBidUser: { color: palette.secondary },
  immersiveBidText: { fontFamily: fonts.bold, color: palette.secondary },

  auctionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  auctionCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  auctionThumb: { width: 44, height: 44, borderRadius: 10 },
  auctionThumbPlaceholder: {
    backgroundColor: palette.avatarBg,
    justifyContent: "center",
    alignItems: "center",
  },
  auctionInfo: { flex: 1 },
  auctionCardTitle: { fontFamily: fonts.bold, fontSize: 13, color: palette.textPrimary },
  auctionCardMeta: { fontFamily: fonts.mono, fontSize: 11, color: palette.textSecondary, marginTop: 2 },

  whatnotRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  customBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.border,
    justifyContent: "center",
    alignItems: "center",
  },
  customBtnText: { fontFamily: fonts.bold, fontSize: 14, color: palette.textPrimary },
  quickBidBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: palette.secondary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  quickBidBtnWide: { flex: 2 },
  quickBidBtnText: { fontFamily: fonts.extrabold, fontSize: 14, color: "#fff" },

  customBidRow: { flexDirection: "row", gap: 8 },
  customBidInput: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.border,
    paddingHorizontal: 14,
    fontFamily: fonts.mono,
    fontSize: 15,
    color: palette.textPrimary,
    backgroundColor: "#fff",
  },

  immersiveCommentBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  immersiveCommentInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 16,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "#fff",
  },
  immersiveGate: { paddingVertical: 8 },
  immersiveGateText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
});

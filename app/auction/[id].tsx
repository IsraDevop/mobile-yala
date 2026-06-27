import { useState } from "react";
import { Image, ScrollView, StyleSheet, TextInput, View, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFetch } from "../../src/hooks/useFetch";
import { usePaginatedFetch } from "../../src/hooks/usePaginatedFetch";
import { CountdownTimer } from "../../src/components/CountdownTimer";
import { BidHistoryItem } from "../../src/components/BidHistoryItem";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { Loader } from "../../src/components/Loader";
import { ErrorView } from "../../src/components/ErrorView";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";
import { bidService } from "../../src/services/bidService";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { formatPrice } from "../../src/utils/formatters";
import { isValidBidAmount } from "../../src/utils/validators";
import type { Auction, Bid } from "../../src/types";
import { palette, fonts } from "../../src/theme/theme";

export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expired, setExpired] = useState(false);

  const { data: auction, loading, error, refetch } = useFetch<Auction>(id ? `/auctions/${id}` : null);
  const { items: bids, refresh: refreshBids } = usePaginatedFetch<Bid>(id ? `/bids/auction/${id}` : "");

  async function handleBid() {
    if (!auction) return;
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || !isValidBidAmount(amount, auction.currentPrice)) {
      showToast(`Tu puja debe superar ${formatPrice(auction.currentPrice)}`, "error");
      return;
    }
    try {
      setSubmitting(true);
      await bidService.place({ auctionId: auction.id, amount });
      showToast("¡Puja registrada!", "success");
      setBidAmount("");
      refetch();
      refreshBids();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (<View style={styles.flex}><ScreenHeader title="Volver" /><Loader /></View>);
  if (error || !auction) return (<View style={styles.flex}><ScreenHeader title="Volver" /><ErrorView message={error ?? "No encontrada"} onRetry={refetch} /></View>);

  const listing = auction.listing;
  const image = listing?.imageUrls?.[0];
  const isActive = auction.status === "ACTIVE" && !expired;
  const increment = Math.max(1, Math.round(auction.currentPrice * 0.01));

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Volver" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text style={styles.placeholderText}>Yala</Text>
            </View>
          )}
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>En vivo</Text>
          </View>
        </View>

        <View style={styles.head}>
          <Text style={styles.breadcrumb}>
            {listing?.category?.name?.toUpperCase()} · {listing?.condition?.toUpperCase()}
          </Text>
          <Text style={styles.title}>{listing?.title ?? "Subasta"}</Text>
        </View>

        <View style={styles.bidBox}>
          <View style={styles.bidBoxTop}>
            <View style={styles.bidLabelRow}>
              <View style={styles.orangeDot} />
              <Text style={styles.bidLabel}>PUJA ACTUAL</Text>
            </View>
            <Text style={styles.closesLabel}>⏱ CIERRA EN</Text>
          </View>
          <View style={styles.bidBoxMid}>
            <Text style={styles.bidPrice}>{formatPrice(auction.currentPrice)}</Text>
            <CountdownTimer endsAt={auction.endsAt} variant="light" onExpire={() => setExpired(true)} />
          </View>
          <Text style={styles.increment}>
            {bids.length} puja{bids.length !== 1 ? "s" : ""} · incremento sugerido {formatPrice(increment)} (1%)
          </Text>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>
            Historial de pujas <Text style={styles.historyMeta}>· en tiempo real</Text>
          </Text>
          {bids.length === 0 ? (
            <Text style={styles.noBids}>Todavía no hay pujas. ¡Sé el primero!</Text>
          ) : (
            bids.map((b, i) => <BidHistoryItem key={b.id} bid={b} isHighest={i === 0} />)
          )}
        </View>
      </ScrollView>

      {isActive && (
        <View style={styles.footer}>
          {user ? (
            <>
              <View style={styles.bidInputWrap}>
                <Text style={styles.bidInputPrefix}>S/.</Text>
                <TextInput
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  placeholder={`${(auction.currentPrice + increment).toFixed(0)}`}
                  placeholderTextColor="#B4B8C0"
                  keyboardType="decimal-pad"
                  style={styles.bidInput}
                />
              </View>
              <Pressable style={styles.pujarBtn} onPress={handleBid} disabled={submitting}>
                <Ionicons name="flash" size={18} color="#fff" />
                <Text style={styles.pujarText}>{submitting ? "..." : "Pujar"}</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.loginBtn} onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.loginText}>Ingresá para pujar</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  content: { paddingBottom: 24 },
  imageWrap: { marginHorizontal: 18, height: 200, borderRadius: 22, overflow: "hidden", backgroundColor: palette.dark },
  image: { width: "100%", height: 200 },
  placeholder: { justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#3A3D46", fontSize: 30, fontFamily: fonts.extrabold },
  liveBadge: {
    position: "absolute", top: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.secondary },
  liveText: { color: palette.secondary, fontFamily: fonts.bold, fontSize: 11 },
  head: { paddingHorizontal: 18, paddingTop: 14 },
  breadcrumb: { fontFamily: fonts.monoBold, fontSize: 10, color: palette.primary, letterSpacing: 0.6 },
  title: { fontFamily: fonts.extrabold, fontSize: 19, color: palette.textPrimary, lineHeight: 24, marginTop: 5 },
  bidBox: {
    marginHorizontal: 18, marginTop: 14, backgroundColor: palette.secondaryBg,
    borderWidth: 1, borderColor: palette.secondaryLight, borderRadius: 20, padding: 16,
  },
  bidBoxTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bidLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  orangeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.secondary },
  bidLabel: { fontFamily: fonts.monoBold, fontSize: 11, color: palette.secondary },
  closesLabel: { fontFamily: fonts.monoBold, fontSize: 11, color: "#B86A4B" },
  bidBoxMid: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 6 },
  bidPrice: { fontFamily: fonts.monoExtra, fontSize: 28, color: palette.secondary },
  increment: { fontFamily: fonts.mono, fontSize: 11, color: "#B86A4B", marginTop: 8 },
  historySection: { paddingHorizontal: 18, paddingTop: 16 },
  historyTitle: { fontFamily: fonts.bold, fontSize: 13, color: palette.textPrimary, marginBottom: 4 },
  historyMeta: { fontFamily: fonts.mono, fontSize: 10, color: palette.textTertiary },
  noBids: { fontFamily: fonts.regular, fontSize: 13, color: palette.textTertiary, paddingVertical: 16, textAlign: "center" },
  footer: {
    flexDirection: "row", gap: 10, alignItems: "center", padding: 14,
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: palette.borderLight,
  },
  bidInputWrap: {
    flex: 1, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: palette.border,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 4,
  },
  bidInputPrefix: { fontFamily: fonts.monoBold, fontSize: 14, color: palette.textPrimary },
  bidInput: { flex: 1, fontFamily: fonts.monoBold, fontSize: 15, color: palette.textPrimary, padding: 0 },
  pujarBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, height: 52, paddingHorizontal: 22,
    borderRadius: 16, backgroundColor: palette.secondary,
  },
  pujarText: { fontFamily: fonts.extrabold, fontSize: 16, color: "#fff" },
  loginBtn: { flex: 1, height: 52, borderRadius: 16, backgroundColor: palette.primary, justifyContent: "center", alignItems: "center" },
  loginText: { fontFamily: fonts.extrabold, fontSize: 16, color: "#fff" },
});

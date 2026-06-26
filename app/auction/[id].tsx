import { useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Button, Divider, Text, TextInput } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import { useFetch } from "../../src/hooks/useFetch";
import { usePaginatedFetch } from "../../src/hooks/usePaginatedFetch";
import { CountdownTimer } from "../../src/components/CountdownTimer";
import { PriceText } from "../../src/components/PriceText";
import { BidHistoryItem } from "../../src/components/BidHistoryItem";
import { Loader } from "../../src/components/Loader";
import { ErrorView } from "../../src/components/ErrorView";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";
import { bidService } from "../../src/services/bidService";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { getAvatarInitials } from "../../src/utils/formatters";
import { isValidBidAmount } from "../../src/utils/validators";
import type { Auction, Bid } from "../../src/types";
import { palette } from "../../src/theme/theme";
import { router } from "expo-router";

export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const { data: auction, loading, error, refetch } = useFetch<Auction>(
    id ? `/auctions/${id}` : null
  );

  const { items: bids, refresh: refreshBids } = usePaginatedFetch<Bid>(
    id ? `/bids/auction/${id}` : ""
  );

  const isActive = auction?.status === "ACTIVE" && !isExpired;
  const suggestedBid = auction ? auction.currentPrice + auction.currentPrice * 0.01 : 0;

  async function handleBid() {
    if (!auction) return;
    const amount = parseFloat(bidAmount);
    if (isNaN(amount)) {
      showToast("Ingresá un monto válido", "error");
      return;
    }
    if (!isValidBidAmount(amount, auction.currentPrice)) {
      showToast(`Tu puja debe superar S/. ${auction.currentPrice.toFixed(2)}`, "error");
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

  if (loading) return <Loader />;
  if (error || !auction) return <ErrorView message={error ?? "No se encontró la subasta"} onRetry={refetch} />;

  const listing = auction.listing;
  const imageUrl = listing?.imageUrls?.[0];

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>YALA</Text>
        </View>
      )}

      <View style={styles.content}>
        {listing?.category && (
          <Text variant="labelSmall" style={styles.category}>
            {listing.category.name.toUpperCase()}
            {listing.condition ? ` · ${listing.condition.toUpperCase()}` : ""}
          </Text>
        )}
        <Text variant="headlineSmall" style={styles.title}>
          {listing?.title ?? "Subasta"}
        </Text>

        <View style={styles.bidBox}>
          <View style={styles.bidBoxHeader}>
            <View>
              <PriceText amount={auction.currentPrice} label="PUJA ACTUAL" size="large" />
            </View>
            <View style={styles.countdown}>
              <Text variant="labelSmall" style={styles.countdownLabel}>CIERRA EN</Text>
              <CountdownTimer endsAt={auction.endsAt} onExpire={() => setIsExpired(true)} />
            </View>
          </View>

          <Text variant="labelSmall" style={styles.suggestedText}>
            Incremento sugerido: S/. {suggestedBid.toFixed(2)} (1%)
          </Text>

          {isActive && user ? (
            <>
              <Text variant="labelMedium" style={styles.bidLabel}>Tu puja</Text>
              <View style={styles.bidRow}>
                <TextInput
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  placeholder={`S/. ${(auction.currentPrice + 1).toFixed(2)}`}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  style={styles.bidInput}
                  left={<TextInput.Affix text="S/." />}
                />
                <Button
                  mode="contained"
                  onPress={handleBid}
                  loading={submitting}
                  disabled={submitting}
                  style={styles.bidBtn}
                  icon="lightning-bolt"
                >
                  Pujar
                </Button>
              </View>
            </>
          ) : !user ? (
            <Button
              mode="contained"
              onPress={() => router.push("/(auth)/login")}
              style={styles.loginBtn}
            >
              Ingresar para pujar
            </Button>
          ) : (
            <Text variant="bodyMedium" style={styles.expiredText}>
              Esta subasta ya finalizó
            </Text>
          )}
        </View>

        {listing?.seller && (
          <View style={styles.sellerRow}>
            <Avatar.Text
              size={40}
              label={getAvatarInitials(listing.seller.name)}
              style={{ backgroundColor: palette.primary }}
            />
            <Text variant="bodyMedium" style={styles.sellerName}>
              {listing.seller.name}
            </Text>
            <Button
              compact
              mode="outlined"
              onPress={() => router.push(`/seller/${listing.seller.id}`)}
            >
              Ver perfil
            </Button>
          </View>
        )}

        <Divider style={styles.divider} />

        <View style={styles.bidHistoryHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Historial de pujas
          </Text>
          <Text variant="labelSmall" style={styles.realtime}>en tiempo real</Text>
        </View>

        {bids.length === 0 ? (
          <Text style={styles.noBids}>Todavía no hay pujas. ¡Sé el primero!</Text>
        ) : (
          bids.map((bid, i) => (
            <BidHistoryItem key={bid.id} bid={bid} isHighest={i === 0} />
          ))
        )}

        {listing?.description && (
          <>
            <Divider style={styles.divider} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Descripción</Text>
            <Text variant="bodyMedium" style={styles.description}>
              {listing.description}
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  container: { paddingBottom: 40 },
  image: { width: "100%", height: 280, resizeMode: "cover" },
  imagePlaceholder: {
    width: "100%", height: 280, backgroundColor: "#1C1C1E",
    justifyContent: "center", alignItems: "center",
  },
  placeholderText: { color: "#fff", fontSize: 40, fontWeight: "900" },
  content: { padding: 16 },
  category: { color: palette.secondary, letterSpacing: 1, marginBottom: 4 },
  title: { fontWeight: "900", color: palette.textPrimary, marginBottom: 16 },
  bidBox: {
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FED7AA",
    marginBottom: 16,
  },
  bidBoxHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  countdown: { alignItems: "flex-end" },
  countdownLabel: { color: palette.textSecondary, marginBottom: 4 },
  suggestedText: { color: palette.textSecondary, marginBottom: 12 },
  bidLabel: { color: palette.textPrimary, marginBottom: 6 },
  bidRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  bidInput: { flex: 1 },
  bidBtn: { backgroundColor: palette.secondary },
  loginBtn: { backgroundColor: palette.primary, marginTop: 8 },
  expiredText: { color: palette.textSecondary, textAlign: "center", marginTop: 8 },
  sellerRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 16,
  },
  sellerName: { flex: 1, fontWeight: "600" },
  divider: { marginVertical: 16 },
  bidHistoryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sectionTitle: { fontWeight: "700", color: palette.textPrimary },
  realtime: { color: palette.textSecondary },
  noBids: { color: palette.textSecondary, textAlign: "center", paddingVertical: 16 },
  description: { color: palette.textPrimary, lineHeight: 22 },
});

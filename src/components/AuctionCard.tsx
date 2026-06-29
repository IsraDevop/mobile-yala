import { Image, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { Auction } from "../types";
import { CountdownTimer } from "./CountdownTimer";
import { PriceText } from "./PriceText";
import { getAvatarInitials } from "../utils/formatters";
import { palette, fonts } from "../theme/theme";

interface AuctionCardProps {
  auction: Auction;
  onPress: () => void;
}

export function AuctionCard({ auction, onPress }: AuctionCardProps) {
  const listing = auction.listing;
  const imageUrl = listing?.imageUrls?.[0];
  const statusLabel =
    auction.status === "FINISHED" ? "Finalizado" : auction.status === "ACTIVE" ? "En subasta" : null;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>Yala</Text>
          </View>
        )}
        {statusLabel && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{statusLabel}</Text>
          </View>
        )}
        <View style={styles.timer}>
          <CountdownTimer endsAt={auction.endsAt} variant="onImage" />
        </View>
      </View>

      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.title}>
          {listing?.title ?? "Subasta"}
        </Text>
        <View style={styles.priceRow}>
          <PriceText amount={auction.currentPrice} label="PUJA ACTUAL" size="large" />
        </View>
        {listing?.seller && (
          <View style={styles.sellerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getAvatarInitials(listing.seller.name)}</Text>
            </View>
            <Text style={styles.seller}>{listing.seller.name}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.borderLight,
    shadowColor: "#11142D",
    shadowOpacity: 0.07,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  imageContainer: { position: "relative", height: 170, backgroundColor: palette.dark },
  image: { width: "100%", height: 170, resizeMode: "cover" },
  placeholder: { justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#3A3D46", fontSize: 34, fontFamily: fonts.extrabold },
  liveBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.secondary },
  liveText: { color: palette.secondary, fontSize: 11, fontFamily: fonts.bold },
  timer: { position: "absolute", bottom: 12, right: 12 },
  content: { padding: 16 },
  title: { fontFamily: fonts.bold, fontSize: 15, color: palette.textPrimary, lineHeight: 19 },
  priceRow: { marginTop: 12 },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F3F6",
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.avatarBg,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: palette.primary, fontSize: 10, fontFamily: fonts.extrabold },
  seller: { fontSize: 12, color: "#5A5F6A", fontFamily: fonts.semibold },
});

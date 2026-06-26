import { Image, Pressable, StyleSheet, View } from "react-native";
import { Card, Chip, Text } from "react-native-paper";
import type { Auction } from "../types";
import { CountdownTimer } from "./CountdownTimer";
import { PriceText } from "./PriceText";
import { getAvatarInitials } from "../utils/formatters";
import { palette } from "../theme/theme";

interface AuctionCardProps {
  auction: Auction;
  onPress: () => void;
}

export function AuctionCard({ auction, onPress }: AuctionCardProps) {
  const listing = auction.listing;
  const imageUrl = listing?.imageUrls?.[0];

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <Card style={styles.card} elevation={2}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text style={styles.placeholderText}>
                {getAvatarInitials(listing?.title ?? "YA")}
              </Text>
            </View>
          )}
          <Chip
            style={styles.liveBadge}
            textStyle={styles.liveBadgeText}
            compact
          >
            ● En vivo
          </Chip>
        </View>

        <Card.Content style={styles.content}>
          <Text variant="titleSmall" numberOfLines={2} style={styles.title}>
            {listing?.title ?? "Subasta"}
          </Text>
          <PriceText amount={auction.currentPrice} label="PUJA ACTUAL" size="small" />
          <View style={styles.timerRow}>
            <CountdownTimer endsAt={auction.endsAt} />
          </View>
          {listing?.seller && (
            <Text variant="labelSmall" style={styles.seller}>
              {listing.seller.name}
            </Text>
          )}
        </Card.Content>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, margin: 6 },
  card: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" },
  imageContainer: { position: "relative" },
  image: { width: "100%", height: 140, resizeMode: "cover" },
  placeholder: {
    backgroundColor: "#1C1C1E",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  liveBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#EA580C",
  },
  liveBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  content: { paddingVertical: 10 },
  title: { fontWeight: "700", color: palette.textPrimary, marginBottom: 4 },
  timerRow: { marginTop: 8, marginBottom: 4 },
  seller: { color: palette.textSecondary, marginTop: 6 },
});

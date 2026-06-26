import { Image, Pressable, StyleSheet, View } from "react-native";
import { Card, Chip, Text } from "react-native-paper";
import type { Listing } from "../types";
import { PriceText } from "./PriceText";
import { palette } from "../theme/theme";

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
}

export function ListingCard({ listing, onPress }: ListingCardProps) {
  const imageUrl = listing.imageUrls?.[0];
  const isAuction = listing.mode === "AUCTION";

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <Card style={styles.card} elevation={2}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholder]} />
          )}
          <Chip
            compact
            style={[
              styles.modeBadge,
              { backgroundColor: isAuction ? palette.secondary : palette.primary },
            ]}
            textStyle={styles.modeBadgeText}
          >
            {isAuction ? "Subasta" : "Precio fijo"}
          </Chip>
        </View>
        <Card.Content style={styles.content}>
          <Text variant="bodyMedium" numberOfLines={2} style={styles.title}>
            {listing.title}
          </Text>
          <Text variant="labelSmall" style={styles.condition}>
            {listing.condition}
          </Text>
          {isAuction && listing.auction ? (
            <PriceText amount={listing.auction.currentPrice} size="small" />
          ) : listing.fixedPrice != null ? (
            <PriceText amount={listing.fixedPrice} size="small" />
          ) : null}
        </Card.Content>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, margin: 6 },
  card: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" },
  imageContainer: { position: "relative" },
  image: { width: "100%", height: 130, resizeMode: "cover", backgroundColor: "#E5E7EB" },
  placeholder: { backgroundColor: "#E5E7EB" },
  modeBadge: { position: "absolute", top: 8, right: 8 },
  modeBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  content: { paddingVertical: 8 },
  title: { fontWeight: "600", color: palette.textPrimary, marginBottom: 2 },
  condition: { color: palette.textSecondary, marginBottom: 4 },
});

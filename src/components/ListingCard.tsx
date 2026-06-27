import { Image, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { Listing } from "../types";
import { formatPrice } from "../utils/formatters";
import { palette, fonts } from "../theme/theme";

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
}

export function ListingCard({ listing, onPress }: ListingCardProps) {
  const imageUrl = listing.imageUrls?.[0];
  const isAuction = listing.mode === "AUCTION";
  const price = isAuction && listing.auction ? listing.auction.currentPrice : listing.fixedPrice;

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text style={styles.placeholderText}>Yala</Text>
            </View>
          )}
          <View
            style={[
              styles.modeBadge,
              { backgroundColor: isAuction ? palette.secondary : "#fff" },
            ]}
          >
            <Text style={[styles.modeText, { color: isAuction ? "#fff" : palette.primary }]}>
              {isAuction ? "Subasta" : "Precio fijo"}
            </Text>
          </View>
        </View>
        <View style={styles.content}>
          <Text variant="labelSmall" style={styles.condition}>
            {listing.category?.name} · {listing.condition}
          </Text>
          <Text numberOfLines={2} style={styles.title}>
            {listing.title}
          </Text>
          {price != null && (
            <Text style={[styles.price, isAuction && styles.priceAuction]}>
              {formatPrice(price)}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, margin: 6 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  imageContainer: { position: "relative" },
  image: { width: "100%", height: 130, resizeMode: "cover", backgroundColor: palette.dark },
  placeholder: { justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#3A3D46", fontSize: 22, fontFamily: fonts.extrabold },
  modeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  modeText: { fontSize: 9, fontFamily: fonts.bold },
  content: { padding: 11 },
  condition: { color: palette.textTertiary, fontSize: 10, marginBottom: 3 },
  title: { fontFamily: fonts.semibold, fontSize: 13, color: palette.textPrimary, lineHeight: 17 },
  price: { fontFamily: fonts.monoExtra, fontSize: 15, color: palette.textPrimary, marginTop: 6 },
  priceAuction: { color: palette.secondary },
});

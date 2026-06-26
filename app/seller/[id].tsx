import { FlatList, StyleSheet, View } from "react-native";
import { Avatar, Divider, Text } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { useFetch } from "../../src/hooks/useFetch";
import { usePaginatedFetch } from "../../src/hooks/usePaginatedFetch";
import { ListingCard } from "../../src/components/ListingCard";
import { RatingStars } from "../../src/components/RatingStars";
import { Loader } from "../../src/components/Loader";
import { ErrorView } from "../../src/components/ErrorView";
import { EmptyState } from "../../src/components/EmptyState";
import { useLocation } from "../../src/hooks/useLocation";
import type { Listing, Review, User } from "../../src/types";
import { getAvatarInitials, formatDate } from "../../src/utils/formatters";
import { palette } from "../../src/theme/theme";
import { Ionicons } from "@expo/vector-icons";

export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { coords, error: locError } = useLocation();

  const { data: seller, loading, error } = useFetch<User>(
    id ? `/users/${id}` : null
  );

  const { items: listings } = usePaginatedFetch<Listing>(
    id ? `/users/${id}/listings` : ""
  );

  const { items: reviews } = usePaginatedFetch<Review>(
    id ? `/reviews/user/${id}` : ""
  );

  if (loading) return <Loader />;
  if (error || !seller) return <ErrorView message={error ?? "No encontrado"} />;

  const mapCoords = coords ?? { latitude: -12.0464, longitude: -77.0428 };

  return (
    <FlatList
      style={styles.flex}
      data={listings}
      numColumns={2}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <ListingCard
          listing={item}
          onPress={() =>
            item.mode === "AUCTION" && item.auction
              ? router.push(`/auction/${item.auction.id}`)
              : router.push(`/listing/${item.id}`)
          }
        />
      )}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            {seller.avatarUrl ? (
              <Avatar.Image size={72} source={{ uri: seller.avatarUrl }} />
            ) : (
              <Avatar.Text
                size={72}
                label={getAvatarInitials(seller.name)}
                style={{ backgroundColor: palette.primary }}
              />
            )}
            <Text variant="headlineSmall" style={styles.name}>{seller.name}</Text>
            {seller.isVerifiedSeller && (
              <View style={styles.verifiedRow}>
                <Ionicons name="checkmark-circle" size={16} color={palette.primary} />
                <Text variant="labelMedium" style={styles.verifiedText}>Vendedor verificado</Text>
              </View>
            )}
            <RatingStars rating={seller.reputation} />
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text variant="headlineMedium" style={styles.statValue}>
                {seller.reputation.toFixed(1)}
              </Text>
              <Text variant="labelSmall" style={styles.statLabel}>Reputación</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="headlineMedium" style={styles.statValue}>
                {listings.length}
              </Text>
              <Text variant="labelSmall" style={styles.statLabel}>Publicaciones</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="headlineMedium" style={styles.statValue}>
                {reviews.length}
              </Text>
              <Text variant="labelSmall" style={styles.statLabel}>Reseñas</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.mapSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Ubicación</Text>
            {locError ? (
              <View style={styles.mapError}>
                <Ionicons name="location-outline" size={24} color={palette.textSecondary} />
                <Text variant="bodySmall" style={styles.mapErrorText}>{locError}</Text>
              </View>
            ) : (
              <MapView
                style={styles.map}
                region={{
                  latitude: mapCoords.latitude,
                  longitude: mapCoords.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                showsUserLocation
              >
                <Marker
                  coordinate={mapCoords}
                  title={seller.name}
                  description="Ubicación del vendedor"
                  pinColor={palette.primary}
                />
              </MapView>
            )}
          </View>

          <Divider style={styles.divider} />

          {reviews.length > 0 && (
            <>
              <Text variant="titleMedium" style={[styles.sectionTitle, styles.padding]}>
                Reseñas ({reviews.length})
              </Text>
              {reviews.slice(0, 3).map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Avatar.Text
                      size={32}
                      label={getAvatarInitials(review.author.name)}
                      style={{ backgroundColor: palette.primary + "80" }}
                    />
                    <View style={styles.reviewMeta}>
                      <Text variant="bodySmall" style={styles.reviewAuthor}>
                        {review.author.name}
                      </Text>
                      <RatingStars rating={review.rating} size={12} />
                    </View>
                    <Text variant="labelSmall" style={styles.reviewDate}>
                      {formatDate(review.createdAt)}
                    </Text>
                  </View>
                  {review.comment && (
                    <Text variant="bodySmall" style={styles.reviewComment}>
                      {review.comment}
                    </Text>
                  )}
                </View>
              ))}
              <Divider style={styles.divider} />
            </>
          )}

          <Text variant="titleMedium" style={[styles.sectionTitle, styles.padding]}>
            Publicaciones
          </Text>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="cube-outline"
          title="Sin publicaciones"
          description="Este vendedor todavía no tiene publicaciones activas."
        />
      }
      contentContainerStyle={styles.grid}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  header: { alignItems: "center", padding: 24, gap: 8, backgroundColor: "#fff" },
  name: { fontWeight: "800", color: palette.textPrimary },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  verifiedText: { color: palette.primary },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    backgroundColor: "#fff",
  },
  stat: { alignItems: "center" },
  statValue: { fontWeight: "900", color: palette.primary },
  statLabel: { color: palette.textSecondary, textTransform: "uppercase" },
  divider: { marginVertical: 8 },
  mapSection: { padding: 16 },
  sectionTitle: { fontWeight: "700", color: palette.textPrimary, padding: 16, paddingBottom: 8 },
  padding: { paddingHorizontal: 16 },
  map: { width: "100%", height: 200, borderRadius: 12 },
  mapError: { flexDirection: "row", alignItems: "center", gap: 8, padding: 8 },
  mapErrorText: { color: palette.textSecondary, flex: 1 },
  reviewItem: { backgroundColor: "#fff", padding: 12, marginHorizontal: 16, marginBottom: 8, borderRadius: 12 },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  reviewMeta: { flex: 1 },
  reviewAuthor: { fontWeight: "600", color: palette.textPrimary },
  reviewDate: { color: palette.textSecondary },
  reviewComment: { color: palette.textSecondary, lineHeight: 18 },
  grid: { paddingHorizontal: 10, paddingBottom: 24 },
});

import { FlatList, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useFetch } from "../../src/hooks/useFetch";
import { usePaginatedFetch } from "../../src/hooks/usePaginatedFetch";
import { useLocation } from "../../src/hooks/useLocation";
import { ListingCard } from "../../src/components/ListingCard";
import { RatingStars } from "../../src/components/RatingStars";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { Loader } from "../../src/components/Loader";
import { ErrorView } from "../../src/components/ErrorView";
import { EmptyState } from "../../src/components/EmptyState";
import { getAvatarInitials } from "../../src/utils/formatters";
import type { Listing, Review, User } from "../../src/types";
import { palette, fonts } from "../../src/theme/theme";

export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { coords, error: locError } = useLocation();

  const { data: seller, loading, error } = useFetch<User>(id ? `/users/${id}` : null);
  const { items: listings } = usePaginatedFetch<Listing>(id ? `/users/${id}/listings` : "");
  const { items: reviews } = usePaginatedFetch<Review>(id ? `/reviews/user/${id}` : "");

  if (loading) return (<View style={styles.flex}><ScreenHeader title="Volver" /><Loader /></View>);
  if (error || !seller) return (<View style={styles.flex}><ScreenHeader title="Volver" /><ErrorView message={error ?? "No encontrado"} /></View>);

  const mapCoords = coords ?? { latitude: -12.0464, longitude: -77.0428 };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Volver" />
      <FlatList
        data={listings}
        numColumns={2}
        keyExtractor={(item) => String(item.id)}
        columnWrapperStyle={styles.column}
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
            <View style={styles.headerCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getAvatarInitials(seller.name)}</Text>
              </View>
              <Text style={styles.name}>{seller.name}</Text>
              {seller.isVerifiedSeller && (
                <View style={styles.verified}>
                  <Ionicons name="checkmark-circle" size={15} color={palette.primary} />
                  <Text style={styles.verifiedText}>Vendedor verificado</Text>
                </View>
              )}
              <RatingStars rating={seller.reputation} count={reviews.length} />
            </View>

            <View style={styles.stats}>
              <Stat value={seller.reputation.toFixed(1)} label="Reputación" border />
              <Stat value={String(listings.length)} label="Publicaciones" border />
              <Stat value={String(reviews.length)} label="Reseñas" />
            </View>

            <View style={styles.mapSection}>
              <Text style={styles.sectionTitle}>Ubicación</Text>
              {locError ? (
                <View style={styles.mapError}>
                  <Ionicons name="location-outline" size={22} color={palette.textSecondary} />
                  <Text style={styles.mapErrorText}>{locError}</Text>
                </View>
              ) : (
                <MapView
                  style={styles.map}
                  region={{ ...mapCoords, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
                  showsUserLocation
                >
                  <Marker coordinate={mapCoords} title={seller.name} pinColor={palette.primary} />
                </MapView>
              )}
            </View>

            <Text style={[styles.sectionTitle, styles.pad]}>Publicaciones</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState icon="cube-outline" title="Sin publicaciones" description="Este vendedor todavía no tiene publicaciones activas." />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function Stat({ value, label, border }: { value: string; label: string; border?: boolean }) {
  return (
    <View style={[styles.stat, border && styles.statBorder]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  list: { paddingBottom: 24 },
  column: { paddingHorizontal: 12 },
  headerCard: { alignItems: "center", padding: 24, gap: 8, backgroundColor: "#fff" },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: palette.avatarBg,
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { color: palette.primary, fontFamily: fonts.extrabold, fontSize: 28 },
  name: { fontFamily: fonts.extrabold, fontSize: 20, color: palette.textPrimary },
  verified: { flexDirection: "row", alignItems: "center", gap: 4 },
  verifiedText: { fontFamily: fonts.semibold, fontSize: 12, color: palette.primary },
  stats: { flexDirection: "row", backgroundColor: "#fff", paddingVertical: 16, marginTop: 1 },
  stat: { flex: 1, alignItems: "center" },
  statBorder: { borderRightWidth: 1, borderRightColor: "#F2F3F6" },
  statValue: { fontFamily: fonts.monoExtra, fontSize: 18, color: palette.primary },
  statLabel: { fontFamily: fonts.regular, fontSize: 11, color: palette.textTertiary, marginTop: 2 },
  mapSection: { padding: 16 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 15, color: palette.textPrimary, marginBottom: 10 },
  pad: { paddingHorizontal: 16, marginTop: 8 },
  map: { width: "100%", height: 180, borderRadius: 14 },
  mapError: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, backgroundColor: "#fff", borderRadius: 14 },
  mapErrorText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: palette.textSecondary },
});

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { useFetch } from "../../src/hooks/useFetch";
import { RatingStars } from "../../src/components/RatingStars";
import { ListingCard } from "../../src/components/ListingCard";
import { EmptyState } from "../../src/components/EmptyState";
import { getAvatarInitials, formatDate } from "../../src/utils/formatters";
import { palette, fonts } from "../../src/theme/theme";
import type { User, Listing, Review } from "../../src/types";

type Tab = "listings" | "reviews";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("listings");

  const { data: fullUser } = useFetch<User>("/users/me");
  const { data: listingsPage } = useFetch<{ content: Listing[] }>(
    user ? `/users/${user.id}/listings?page=0&size=20` : null
  );
  const { data: reviewsPage } = useFetch<{ content: Review[] }>(
    user ? `/reviews/user/${user.id}?page=0&size=20` : null
  );

  const me = fullUser ?? user;
  if (!me) return null;

  const listings = listingsPage?.content ?? [];
  const reviews = reviewsPage?.content ?? [];
  const reputation = fullUser?.reputation ?? 0;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push("/edit-profile")} hitSlop={8}>
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getAvatarInitials(me.name)}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{me.name}</Text>
            <Text style={styles.subtitle}>
              {me.role === "SELLER" ? "Vendedor en Yala" : "Usuario en Yala"}
            </Text>
            <View style={styles.headerStars}>
              <RatingStars
                rating={reputation}
                count={reviews.length}
                size={13}
                starColor="#FFD9A0"
                textColor="#FFD9A0"
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.statsWrap}>
        <View style={styles.statsCard}>
          <View style={[styles.stat, styles.statBorder]}>
            <Text style={styles.statValue}>{reputation.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Reputación</Text>
          </View>
          <View style={[styles.stat, styles.statBorder]}>
            <Text style={styles.statValue}>{reviews.length}</Text>
            <Text style={styles.statLabel}>Reseñas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{listings.length}</Text>
            <Text style={styles.statLabel}>Publicaciones</Text>
          </View>
        </View>
      </View>

      <Pressable style={styles.ordersRow} onPress={() => router.push("/orders")}>
        <View style={styles.ordersIcon}>
          <Ionicons name="receipt-outline" size={18} color={palette.primary} />
        </View>
        <Text style={styles.ordersText}>Mis órdenes</Text>
        <Ionicons name="chevron-forward" size={18} color="#9499A3" />
      </Pressable>

      <View style={styles.tabs}>
        <Pressable onPress={() => setTab("listings")}>
          <Text style={[styles.tab, tab === "listings" && styles.tabActive]}>Publicaciones</Text>
          {tab === "listings" && <View style={styles.underline} />}
        </Pressable>
        <Pressable onPress={() => setTab("reviews")}>
          <Text style={[styles.tab, tab === "reviews" && styles.tabActive]}>Reseñas</Text>
          {tab === "reviews" && <View style={styles.underline} />}
        </Pressable>
      </View>

      {tab === "listings" ? (
        listings.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="Sin publicaciones"
            description="Todavía no tienes publicaciones activas."
            ctaLabel={me.role === "SELLER" ? "Crear publicación" : undefined}
            onCta={me.role === "SELLER" ? () => router.push("/(tabs)/sell") : undefined}
          />
        ) : (
          <View style={styles.grid}>
            {listings.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                onPress={() =>
                  item.mode === "AUCTION" && item.auction
                    ? router.push(`/auction/${item.auction.id}`)
                    : router.push(`/listing/${item.id}`)
                }
              />
            ))}
          </View>
        )
      ) : reviews.length === 0 ? (
        <EmptyState
          icon="star-outline"
          title="Sin reseñas"
          description="Las reseñas de tus compras y ventas aparecerán acá."
        />
      ) : (
        <View style={styles.reviews}>
          {reviews.map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHead}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>{getAvatarInitials(r.author.name)}</Text>
                </View>
                <View style={styles.reviewMeta}>
                  <Text style={styles.reviewAuthor}>{r.author.name}</Text>
                  <RatingStars rating={r.rating} size={12} showValue={false} />
                </View>
                <Text style={styles.reviewDate}>{formatDate(r.createdAt)}</Text>
              </View>
              {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  content: { paddingBottom: 30 },
  header: { backgroundColor: palette.primary, paddingHorizontal: 20, paddingBottom: 26 },
  headerActions: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: palette.primary, fontFamily: fonts.extrabold, fontSize: 24 },
  headerInfo: { flex: 1 },
  name: { fontFamily: fonts.extrabold, fontSize: 21, color: "#fff" },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  headerStars: { marginTop: 4 },
  statsWrap: { paddingHorizontal: 18, marginTop: -16 },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    shadowColor: "#11142D",
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  stat: { flex: 1, alignItems: "center" },
  statBorder: { borderRightWidth: 1, borderRightColor: "#F2F3F6" },
  statValue: { fontFamily: fonts.monoExtra, fontSize: 18, color: palette.textPrimary },
  statLabel: { fontFamily: fonts.regular, fontSize: 11, color: palette.textTertiary, marginTop: 2 },
  ordersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginHorizontal: 18,
    marginTop: 14,
  },
  ordersIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: palette.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  ordersText: { flex: 1, fontFamily: fonts.bold, fontSize: 14, color: palette.textPrimary },
  tabs: {
    flexDirection: "row",
    gap: 22,
    paddingHorizontal: 18,
    marginTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEFF2",
  },
  tab: { fontFamily: fonts.semibold, fontSize: 14, color: "#A2A6B0", paddingBottom: 12 },
  tabActive: { fontFamily: fonts.extrabold, color: palette.primary },
  underline: { height: 2.5, backgroundColor: palette.primary, borderRadius: 2, marginTop: -2.5 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, paddingTop: 12 },
  reviews: { padding: 18, gap: 10 },
  reviewCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: 14,
    padding: 12,
  },
  reviewHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.avatarBg,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewAvatarText: { color: palette.primary, fontFamily: fonts.extrabold, fontSize: 11 },
  reviewMeta: { flex: 1 },
  reviewAuthor: { fontFamily: fonts.semibold, fontSize: 13, color: palette.textPrimary },
  reviewDate: { fontFamily: fonts.mono, fontSize: 10, color: palette.textTertiary },
  reviewComment: { fontFamily: fonts.regular, fontSize: 13, color: "#5A5F6A", marginTop: 8, lineHeight: 18 },
});

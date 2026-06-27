import { Image, Linking, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFetch } from "../../src/hooks/useFetch";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { Loader } from "../../src/components/Loader";
import { ErrorView } from "../../src/components/ErrorView";
import type { LiveDetail } from "../../src/types";
import { palette, fonts } from "../../src/theme/theme";

// The native LiveKit player is deferred (needs an EAS dev build); for now mobile
// shows the live info and deep-links to the web player.
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || "https://yala.dpdns.org";

export default function LiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: live, loading, error, refetch } = useFetch<LiveDetail>(`/live/${id}`);

  if (loading) return <View style={styles.flex}><ScreenHeader title="Transmisión" /><Loader /></View>;
  if (error || !live) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Transmisión" />
        <ErrorView message={error || "No encontramos la transmisión."} onRetry={refetch} />
      </View>
    );
  }

  const openWeb = () => Linking.openURL(`${WEB_URL}/live/${live.id}`);

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Transmisión en vivo" />
      <View style={styles.body}>
        <View style={styles.media}>
          {live.coverImageUrl ? (
            <Image source={{ uri: live.coverImageUrl }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.placeholder]}>
              <Ionicons name="videocam" size={40} color="#fff" />
            </View>
          )}
          <View style={styles.badge}>
            <View style={styles.dot} />
            <Text style={styles.badgeText}>En vivo</Text>
          </View>
        </View>

        <Text style={styles.title}>{live.title}</Text>
        {live.seller ? <Text style={styles.seller}>{live.seller.name}</Text> : null}

        {live.activeAuction ? (
          <View style={styles.auctionBox}>
            <Text style={styles.auctionLabel}>Subasta flash en curso</Text>
            <Text style={styles.auctionTitle}>{live.activeAuction.title}</Text>
            <Text style={styles.auctionPrice}>
              S/. {live.activeAuction.currentPrice ?? live.activeAuction.basePrice}
            </Text>
          </View>
        ) : null}

        <Text style={styles.note}>
          Mira el video, chatea y puja en vivo desde la web de Yala.
        </Text>
        <PrimaryButton label="Ver en la web" onPress={openWeb} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  body: { padding: 20, gap: 12 },
  media: { position: "relative", borderRadius: 18, overflow: "hidden", backgroundColor: palette.primary },
  cover: { width: "100%", height: 200, resizeMode: "cover" },
  placeholder: { justifyContent: "center", alignItems: "center" },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.secondary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  badgeText: { color: "#fff", fontSize: 11, fontFamily: fonts.bold, textTransform: "uppercase" },
  title: { fontFamily: fonts.extrabold, fontSize: 20, color: palette.textPrimary },
  seller: { fontFamily: fonts.semibold, fontSize: 14, color: palette.textSecondary },
  auctionBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.borderLight,
    gap: 4,
  },
  auctionLabel: { fontFamily: fonts.mono, fontSize: 11, color: palette.textTertiary, textTransform: "uppercase" },
  auctionTitle: { fontFamily: fonts.bold, fontSize: 15, color: palette.textPrimary },
  auctionPrice: { fontFamily: fonts.monoExtra, fontSize: 18, color: palette.primary },
  note: { fontFamily: fonts.regular, fontSize: 13, color: palette.textSecondary, marginTop: 4 },
});

import { Image, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { LiveSummary } from "../types";
import { palette, fonts } from "../theme/theme";

interface LiveCardProps {
  live: LiveSummary;
  onPress: () => void;
}

// Horizontal card for the "En vivo ahora" home carousel.
export function LiveCard({ live, onPress }: LiveCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.media}>
        {live.coverImageUrl ? (
          <Image source={{ uri: live.coverImageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>Yala</Text>
          </View>
        )}
        <View style={styles.badge}>
          <View style={styles.dot} />
          <Text style={styles.badgeText}>En vivo</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.title}>{live.title}</Text>
        {live.sellerName ? <Text style={styles.seller}>{live.sellerName}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 230,
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  media: { position: "relative", height: 130, backgroundColor: palette.primary },
  image: { width: "100%", height: 130, resizeMode: "cover" },
  placeholder: { justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#fff", fontSize: 28, fontFamily: fonts.extrabold, opacity: 0.6 },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: palette.secondary,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  badgeText: { color: "#fff", fontSize: 10, fontFamily: fonts.bold, textTransform: "uppercase" },
  body: { padding: 12 },
  title: { fontFamily: fonts.bold, fontSize: 14, color: palette.textPrimary, lineHeight: 18 },
  seller: { fontFamily: fonts.semibold, fontSize: 12, color: "#5A5F6A", marginTop: 4 },
});

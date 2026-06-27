import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import type { Notification, NotificationType } from "../types";
import { timeAgo } from "../utils/formatters";
import { palette, fonts } from "../theme/theme";

const ICONS: Record<NotificationType, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  BID_OUTBID: { name: "flash", color: palette.secondary },
  AUCTION_WON: { name: "checkmark", color: palette.success },
  SALE_CONFIRMED: { name: "checkmark", color: palette.primary },
  NEW_BID: { name: "flash", color: palette.secondary },
};

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const icon = ICONS[notification.type] ?? ICONS.NEW_BID;
  const unread = !notification.isRead;

  return (
    <Pressable onPress={onPress} style={[styles.card, unread ? styles.unread : styles.read]}>
      <View style={[styles.icon, { backgroundColor: icon.color }]}>
        <Ionicons name={icon.name} size={18} color="#fff" />
      </View>
      <View style={styles.content}>
        <Text style={[styles.message, unread ? styles.messageUnread : styles.messageRead]} numberOfLines={3}>
          {notification.message}
        </Text>
        <Text style={styles.meta}>
          {timeAgo(notification.createdAt)} · {notification.type}
        </Text>
      </View>
      {unread && <View style={styles.dot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  unread: { backgroundColor: "#EEF0FE", borderColor: "#DCE0FC" },
  read: { backgroundColor: "#fff", borderColor: palette.borderLight },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flex: 1 },
  message: { fontSize: 13, lineHeight: 18 },
  messageUnread: { color: palette.textPrimary, fontFamily: fonts.semibold },
  messageRead: { color: "#5A5F6A", fontFamily: fonts.regular },
  meta: { fontFamily: fonts.mono, fontSize: 10, color: palette.textTertiary, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.primary, marginTop: 4 },
});

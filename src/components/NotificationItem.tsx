import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import type { Notification, NotificationType } from "../types";
import { formatDateTime } from "../utils/formatters";
import { palette } from "../theme/theme";

const ICONS: Record<NotificationType, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  BID_OUTBID: { name: "trending-up", color: palette.secondary },
  AUCTION_WON: { name: "trophy", color: "#FBBF24" },
  SALE_CONFIRMED: { name: "checkmark-circle", color: palette.success ?? "#16A34A" },
  NEW_BID: { name: "cash", color: palette.primary },
};

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const icon = ICONS[notification.type];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, !notification.isRead && styles.unread]}
    >
      <View style={[styles.iconContainer, { backgroundColor: icon.color + "20" }]}>
        <Ionicons name={icon.name} size={22} color={icon.color} />
      </View>
      <View style={styles.content}>
        <Text
          variant="bodyMedium"
          style={[styles.message, !notification.isRead && styles.boldMessage]}
          numberOfLines={2}
        >
          {notification.message}
        </Text>
        <Text variant="labelSmall" style={styles.date}>
          {formatDateTime(notification.createdAt)}
        </Text>
      </View>
      {!notification.isRead && <View style={styles.dot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    gap: 12,
  },
  unread: { backgroundColor: "#F5F3FF" },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flex: 1 },
  message: { color: palette.textPrimary },
  boldMessage: { fontWeight: "700" },
  date: { color: palette.textSecondary, marginTop: 2 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.primary,
  },
});

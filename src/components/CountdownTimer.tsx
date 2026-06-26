import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { getTimeLeft } from "../utils/formatters";
import { palette } from "../theme/theme";

interface CountdownTimerProps {
  endsAt: string;
  onExpire?: () => void;
}

export function CountdownTimer({ endsAt, onExpire }: CountdownTimerProps) {
  const [time, setTime] = useState(() => getTimeLeft(endsAt));

  useEffect(() => {
    const interval = setInterval(() => {
      const t = getTimeLeft(endsAt);
      setTime(t);
      if (t.expired) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt, onExpire]);

  if (time.expired) {
    return (
      <Text variant="labelLarge" style={styles.expired}>Subasta finalizada</Text>
    );
  }

  const segments = [
    { value: time.days, label: "DÍAS" },
    { value: time.hours, label: "HRS" },
    { value: time.minutes, label: "MIN" },
    { value: time.seconds, label: "SEG" },
  ];

  return (
    <View style={styles.row}>
      {segments.map(({ value, label }, i) => (
        <View key={label} style={styles.segment}>
          <View style={styles.block}>
            <Text variant="headlineSmall" style={styles.number}>
              {String(value).padStart(2, "0")}
            </Text>
          </View>
          <Text variant="labelSmall" style={styles.label}>{label}</Text>
          {i < 3 && <Text style={styles.colon}>:</Text>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  segment: { alignItems: "center", flexDirection: "row", gap: 4 },
  block: {
    backgroundColor: "#1C1C1E",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 42,
    alignItems: "center",
  },
  number: { color: "#FFFFFF", fontWeight: "700", fontVariant: ["tabular-nums"] },
  label: { color: palette.textSecondary, fontSize: 10, position: "absolute", bottom: -14 },
  colon: { color: palette.secondary, fontSize: 20, fontWeight: "700", marginBottom: 4 },
  expired: { color: palette.textSecondary },
});

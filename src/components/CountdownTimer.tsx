import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { getTimeLeft } from "../utils/formatters";
import { palette, fonts } from "../theme/theme";

interface CountdownTimerProps {
  endsAt: string;
  onExpire?: () => void;
  variant?: "onImage" | "light";
}

export function CountdownTimer({ endsAt, onExpire, variant = "light" }: CountdownTimerProps) {
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
    return <Text style={styles.expired}>Finalizada</Text>;
  }

  const segments =
    time.days > 0
      ? [
          { value: time.days, label: "DÍAS" },
          { value: time.hours, label: "HRS" },
          { value: time.minutes, label: "MIN" },
        ]
      : [
          { value: time.hours, label: "HRS" },
          { value: time.minutes, label: "MIN" },
          { value: time.seconds, label: "SEG" },
        ];

  const onImage = variant === "onImage";

  return (
    <View style={styles.row}>
      {segments.map(({ value, label }) => (
        <View
          key={label}
          style={[styles.block, onImage ? styles.blockImage : styles.blockLight]}
        >
          <Text style={[styles.number, onImage ? styles.numberImage : styles.numberLight]}>
            {String(value).padStart(2, "0")}
          </Text>
          <Text style={[styles.label, onImage ? styles.labelImage : styles.labelLight]}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 5 },
  block: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4, alignItems: "center", minWidth: 32 },
  blockImage: { backgroundColor: "rgba(255,255,255,0.14)" },
  blockLight: { backgroundColor: "#fff" },
  number: { fontFamily: fonts.monoExtra, fontSize: 14, lineHeight: 17 },
  numberImage: { color: "#fff" },
  numberLight: { color: palette.textPrimary },
  label: { fontFamily: fonts.mono, fontSize: 7, marginTop: 1 },
  labelImage: { color: "#9DA2AE" },
  labelLight: { color: "#B0859B" },
  expired: { fontFamily: fonts.monoBold, fontSize: 12, color: palette.textSecondary },
});

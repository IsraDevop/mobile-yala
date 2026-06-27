import { Image, StyleSheet } from "react-native";

const WORDMARK = require("../../assets/yala-logo.png"); // 939x334 — mark + wordmark
const MARK = require("../../assets/yala-mark.png"); //      331x331 — mark only

interface Props {
  size?: number;
  showWordmark?: boolean;
}

export function Logo({ size = 24, showWordmark = true }: Props) {
  const height = size * 1.5;
  const source = showWordmark ? WORDMARK : MARK;
  const ratio = showWordmark ? 939 / 334 : 331 / 331;
  return (
    <Image
      source={source}
      style={[styles.logo, { height, width: height * ratio }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: { alignSelf: "flex-start" },
});

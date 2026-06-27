import { StyleSheet, View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette, fonts } from "../theme/theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Buscar Charizard, Funko, comics…",
}: SearchBarProps) {
  return (
    <View style={styles.bar}>
      <Ionicons name="search" size={17} color="#9499A3" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9499A3"
        style={styles.input}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 46,
    backgroundColor: palette.fill,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: palette.textPrimary,
    padding: 0,
  },
});

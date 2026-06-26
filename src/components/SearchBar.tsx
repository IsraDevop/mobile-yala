import { StyleSheet } from "react-native";
import { Searchbar } from "react-native-paper";
import { palette } from "../theme/theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = "Buscar Charizard, Funko, comics..." }: SearchBarProps) {
  return (
    <Searchbar
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={styles.bar}
      inputStyle={styles.input}
      elevation={0}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  input: { fontSize: 14 },
});

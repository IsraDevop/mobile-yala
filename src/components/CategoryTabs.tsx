import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import type { Category } from "../types";
import { palette, fonts } from "../theme/theme";

interface CategoryTabsProps {
  categories: Category[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
    >
      <Text style={[styles.text, active ? styles.textActive : styles.textIdle]}>{label}</Text>
    </Pressable>
  );
}

export function CategoryTabs({ categories, selected, onSelect }: CategoryTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      <Pill label="Todo" active={selected === null} onPress={() => onSelect(null)} />
      {categories.map((cat) => (
        <Pill
          key={cat.id}
          label={cat.name}
          active={selected === cat.id}
          onPress={() => onSelect(cat.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { flexDirection: "row", gap: 9, paddingRight: 20 },
  chip: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  chipActive: { backgroundColor: palette.primary },
  chipIdle: { backgroundColor: palette.fill },
  text: { fontSize: 13, fontFamily: fonts.bold },
  textActive: { color: "#fff" },
  textIdle: { color: "#5A5F6A" },
});

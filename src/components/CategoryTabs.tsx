import { ScrollView, StyleSheet, View } from "react-native";
import { Chip } from "react-native-paper";
import type { Category } from "../types";
import { palette } from "../theme/theme";

interface CategoryTabsProps {
  categories: Category[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}

export function CategoryTabs({ categories, selected, onSelect }: CategoryTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      <View style={styles.chipWrapper}>
        <Chip
          selected={selected === null}
          onPress={() => onSelect(null)}
          style={[styles.chip, selected === null && styles.chipSelected]}
          textStyle={[styles.chipText, selected === null && styles.chipTextSelected]}
        >
          Todo
        </Chip>
      </View>
      {categories.map((cat) => (
        <View key={cat.id} style={styles.chipWrapper}>
          <Chip
            selected={selected === cat.id}
            onPress={() => onSelect(cat.id)}
            style={[styles.chip, selected === cat.id && styles.chipSelected]}
            textStyle={[styles.chipText, selected === cat.id && styles.chipTextSelected]}
          >
            {cat.name}
          </Chip>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chipWrapper: {},
  chip: { backgroundColor: "#F3F4F6", borderRadius: 20 },
  chipSelected: { backgroundColor: palette.primary },
  chipText: { color: palette.textPrimary, fontSize: 13 },
  chipTextSelected: { color: "#fff" },
});

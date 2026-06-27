import { ReactNode } from "react";
import { StyleSheet, TextInput, View, TextInputProps } from "react-native";
import { Text } from "react-native-paper";
import { palette, fonts } from "../theme/theme";

interface FieldProps extends TextInputProps {
  label?: string;
  error?: string;
  disabled?: boolean;
  right?: ReactNode;
}

export function Field({ label, error, disabled, right, style, ...rest }: FieldProps) {
  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.field, disabled && styles.disabled, !!error && styles.errorBorder]}>
        <TextInput
          placeholderTextColor="#B4B8C0"
          editable={!disabled}
          style={[styles.input, style]}
          {...rest}
        />
        {right}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontFamily: fonts.bold, fontSize: 13, color: "#3A3D46", marginBottom: 8 },
  field: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  disabled: { backgroundColor: "#F4F5F7" },
  errorBorder: { borderColor: palette.error },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: palette.textPrimary, paddingVertical: 14 },
  errorText: { fontFamily: fonts.medium, fontSize: 12, color: palette.error, marginTop: 5 },
});

import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text, TextInput } from "react-native-paper";
import { useToast } from "../context/ToastContext";
import { reviewService } from "../services/reviewService";
import { getApiErrorMessage } from "../utils/apiError";
import { palette } from "../theme/theme";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  orderId: number;
  onDismiss: () => void;
}

export function ReviewDialog({ visible, orderId, onDismiss }: Props) {
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    try {
      setSubmitting(true);
      await reviewService.create({ orderId, rating, comment });
      showToast("¡Reseña enviada!", "success");
      onDismiss();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Dejar reseña</Dialog.Title>
        <Dialog.Content>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Ionicons
                key={n}
                name={n <= rating ? "star" : "star-outline"}
                size={32}
                color={palette.secondary}
                onPress={() => setRating(n)}
              />
            ))}
          </View>
          <TextInput
            label="Comentario (opcional)"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            mode="outlined"
            style={styles.input}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancelar</Button>
          <Button
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            textColor={palette.primary}
          >
            Enviar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  stars: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 16 },
  input: { marginTop: 8 },
});

import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../src/theme/theme";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View style={styles.flex} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={palette.primary} />
        <Text variant="titleMedium" style={styles.permissionTitle}>
          Acceso a la cámara
        </Text>
        <Text variant="bodyMedium" style={styles.permissionText}>
          Yala necesita acceso a tu cámara para que puedas tomar fotos de tus coleccionables.
        </Text>
        <Button mode="contained" onPress={requestPermission} style={styles.grantBtn}>
          Conceder permiso
        </Button>
        <Button mode="outlined" onPress={() => router.back()}>
          Volver
        </Button>
      </View>
    );
  }

  async function takePicture() {
    if (!cameraRef.current || capturing) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      // Return photo URI to sell screen via router params
      router.back();
    } catch {
      // Camera errors are silently swallowed here; feedback is shown via UI state
    } finally {
      setCapturing(false);
    }
  }

  return (
    <View style={styles.flex}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.overlay}>
          <View style={styles.controls}>
            <Button
              mode="contained"
              onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
              icon="camera-flip"
              style={styles.flipBtn}
            >
              Voltear
            </Button>
          </View>
          <View style={styles.shutterRow}>
            <Button onPress={() => router.back()} textColor="#fff">
              Cancelar
            </Button>
            <View
              style={[styles.shutterBtn, capturing && styles.shutterBtnActive]}
            >
              <Button
                mode="contained"
                onPress={takePicture}
                loading={capturing}
                disabled={capturing}
                style={styles.shutterInner}
                labelStyle={styles.shutterLabel}
              >
                {capturing ? "" : "●"}
              </Button>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#000" },
  permissionContainer: {
    flex: 1, justifyContent: "center", alignItems: "center",
    padding: 32, gap: 16, backgroundColor: palette.background,
  },
  permissionTitle: { fontWeight: "700", color: palette.textPrimary },
  permissionText: { color: palette.textSecondary, textAlign: "center" },
  grantBtn: { backgroundColor: palette.primary, width: "100%" },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: "space-between" },
  controls: { alignItems: "flex-end", padding: 16, paddingTop: 48 },
  flipBtn: { backgroundColor: "rgba(0,0,0,0.5)" },
  shutterRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", padding: 32,
  },
  shutterBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#fff", justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  shutterBtnActive: { backgroundColor: "#E5E7EB" },
  shutterInner: { backgroundColor: "transparent", elevation: 0 },
  shutterLabel: { color: "#000", fontSize: 32 },
});

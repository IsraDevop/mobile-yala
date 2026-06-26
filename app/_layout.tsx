import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { AuthProvider } from "../src/context/AuthContext";
import { ToastProvider } from "../src/context/ToastContext";
import { lightTheme, darkTheme } from "../src/theme/theme";

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? darkTheme : lightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <ToastProvider>
            <StatusBar style={scheme === "dark" ? "light" : "dark"} />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="listing/[id]" options={{ headerShown: true, title: "Detalle" }} />
              <Stack.Screen name="auction/[id]" options={{ headerShown: true, title: "Subasta en vivo" }} />
              <Stack.Screen name="seller/[id]" options={{ headerShown: true, title: "Perfil de vendedor" }} />
              <Stack.Screen name="create-auction" options={{ headerShown: true, title: "Crear subasta" }} />
              <Stack.Screen name="camera" options={{ headerShown: true, title: "Cámara" }} />
            </Stack>
          </ToastProvider>
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

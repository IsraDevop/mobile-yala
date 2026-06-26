import * as Location from "expo-location";
import { useEffect, useState } from "react";

interface LocationState {
  coords: { latitude: number; longitude: number } | null;
  error: string | null;
  loading: boolean;
}

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    coords: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const available = await Location.hasServicesEnabledAsync();
        if (!available) {
          if (!cancelled)
            setState({ coords: null, loading: false, error: "GPS no disponible en este dispositivo." });
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (!cancelled)
            setState({
              coords: null,
              loading: false,
              error: "Permiso de ubicación denegado. Actívalo en Configuración > Aplicaciones.",
            });
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!cancelled)
          setState({
            coords: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
            error: null,
            loading: false,
          });
      } catch {
        if (!cancelled)
          setState({
            coords: null,
            loading: false,
            error: "No se pudo obtener la ubicación. Verifica que el GPS esté activo.",
          });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}

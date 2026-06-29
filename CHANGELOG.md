# Changelog

Todas las versiones notables de **Yala Mobile** (Expo + React Native). El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y el proyecto usa
[Versionado Semántico](https://semver.org/lang/es/).

## [1.0.0] — 2026-06-29

Primer release de la app móvil de Yala (marketplace de subastas y venta directa de coleccionables
geek). Consume el backend desplegado en `https://yala.dpdns.org`.

### Identidad y cuenta
- Registro de comprador con **DNI + nombres y apellidos**, validado contra RENIEC (#38).
- Sincronización de identidad y sesión en `AuthContext` (login/refresh/persistencia) (#39).

### Vendedores
- Alta de vendedor mediante **aplicación con KYC de Didit** (tienda, dirección, contacto, CCI) (#40).
- Panel de **Ventas / Ganadores** del vendedor (#41).
- **Tarjeta de datos de tienda** en el perfil público del vendedor (#42).

### Transmisiones en vivo (LiveKit + STOMP)
- Carrusel de **lives en la home** y pantalla de **pendientes de pago** (48 h) (#35).
- **Fundación nativa LiveKit**: dev build, `@livekit/react-native`, WebRTC, `@stomp/stompjs`,
  permisos y fallback automático para Expo Go (#48).
- **Capa de datos de lives**: `liveService` (REST), cliente STOMP `liveSocket` y tipos (#49).
- **Espectador de live** con paridad completa: video nativo + chat en tiempo real + pujas flash
  (o fallback a la web en Expo Go) (#50).
- **Host "Salir en vivo"** desde el celular: publicar cámara/mic, crear/cerrar subastas flash y
  terminar la transmisión (#51).

### Mejoras de QA (dev build, Android real)
- Fix del **crash al abrir "Mis órdenes"** (`formatPrice` con guard ante montos no numéricos) y
  **CTA "Conviértete en vendedor"** en el gate de no-vendedores (#60).
- **Pull-to-refresh** en Home y Perfil, **KeyboardAvoidingView** en los formularios y respeto del
  **safe area inferior** en las barras de acción (#62).
- **Condición** del formulario de publicación como **selector (dropdown)** y eliminación de la
  sección de **Tags** (#64).
- **Realtime del live resiliente**: re-suscripción automática al reconectar, sin la race del primer
  connect y sin el cuelgue del `await` (#66).

### Infraestructura y build
- Sincronización de `package-lock` y fijado de `react-dom` 19.1.0 (compatible Expo SDK 54) (#37).
- `.npmrc` con `legacy-peer-deps` y configuración de `projectId` de EAS.
- Build de distribución **APK** vía EAS Build (perfil `preview`).

[1.0.0]: https://github.com/IsraDevop/Frontend-Mobile2/releases/tag/v1.0.0

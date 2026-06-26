export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    switch (axiosError.response?.status) {
      case 400: return "Datos inválidos. Revisa el formulario.";
      case 401: return "Tu sesión expiró. Inicia sesión de nuevo.";
      case 403: return "No tienes permiso para esta acción.";
      case 404: return "No se encontró el recurso solicitado.";
      case 409: return "Conflicto: revisa que los datos sean correctos.";
      case 500: return "Error del servidor. Intenta más tarde.";
      default:
        if (axiosError.message?.includes("Network"))
          return "Sin conexión. Verifica tu internet.";
        return "Ocurrió un error inesperado.";
    }
  }
  return "Ocurrió un error inesperado.";
}

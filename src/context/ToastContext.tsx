import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Snackbar } from "react-native-paper";

type ToastType = "success" | "error" | "info";

interface ToastState {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastState | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("info");

  const showToast = useCallback((msg: string, t: ToastType = "info") => {
    setMessage(msg);
    setType(t);
    setVisible(true);
  }, []);

  const bgColor =
    type === "success" ? "#16A34A" : type === "error" ? "#DC2626" : "#374151";

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3500}
        style={{ backgroundColor: bgColor }}
      >
        {message}
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastState {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

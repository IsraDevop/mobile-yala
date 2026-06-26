import { useCallback, useState } from "react";

export function useForm<T extends Record<string, unknown>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const setValue = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    []
  );

  const setError = useCallback(<K extends keyof T>(key: K, message: string) => {
    setErrors((prev) => ({ ...prev, [key]: message }));
  }, []);

  const clearErrors = useCallback(() => setErrors({}), []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  return { values, errors, setValue, setError, clearErrors, reset };
}

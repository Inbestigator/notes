import { useDebouncedCallback } from "use-debounce";
import useUpdateItem from "./useUpdateItem";
import { useEffect, useState } from "react";

export default function useDebouncedUpdate<T>(
  id: string,
  initial: T,
  timeout = 150,
  callback?: (v: T) => void,
) {
  const [value, setValue] = useState(initial);
  const updateItem = useUpdateItem(id);
  const action = callback ? callback : updateItem;
  const debouncedDetails = useDebouncedCallback(action, timeout);

  useEffect(() => {
    setValue(initial);
  }, [id, initial]);

  return [
    value,
    ((v: T) => {
      setValue((p) => (typeof v === "object" ? { ...p, ...v } : (v as T)));
      debouncedDetails(v);
    }) as React.Dispatch<React.SetStateAction<Partial<T>>>,
  ] as const;
}

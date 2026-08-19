import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

const PREFIX = "book-notes:draft:";

function readDraft<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw !== null ? (JSON.parse(raw) as T) : initial;
  } catch {
    return initial;
  }
}

/**
 * Like useState, but the value survives navigation (and reloads) by mirroring
 * into localStorage under a caller-chosen key.
 *
 * Call `clearDraft()` after a successful save so the next blank form doesn't
 * resurrect old text — it also resets the in-memory value back to `initial`.
 * Call `clearDraft(false)` when the current value should stay on screen as-is
 * (e.g. an editor that stays mounted and already shows the just-saved text) —
 * this only forgets the persisted copy, not the live value.
 *
 * Pass `key: null` to opt out of persistence entirely (behaves like plain
 * useState) — useful when the same component is reused for both a
 * persisted "add new" form and a non-persisted "edit existing" form.
 */
export function useDraft<T>(
  key: string | null,
  initial: T,
): [T, Dispatch<SetStateAction<T>>, (resetValue?: boolean) => void] {
  const [value, setValue] = useState<T>(() => (key ? readDraft(key, initial) : initial));

  useEffect(() => {
    setValue(key ? readDraft(key, initial) : initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!key) return;
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // ignore quota errors — draft persistence is best-effort
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value]);

  const clearDraft = (resetValue = true) => {
    if (key) localStorage.removeItem(PREFIX + key);
    if (resetValue) setValue(initial);
  };

  return [value, setValue, clearDraft];
}

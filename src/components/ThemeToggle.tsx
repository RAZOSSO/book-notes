import { useTheme, type ThemeMode } from "../hooks/useTheme";

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: "system", label: "自動" },
  { mode: "light", label: "ライト" },
  { mode: "dark", label: "ダーク" },
];

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();

  return (
    <div className="theme-toggle" role="group" aria-label="表示テーマ">
      {OPTIONS.map((opt) => (
        <button
          key={opt.mode}
          type="button"
          className={`theme-toggle-btn ${theme === opt.mode ? "active" : ""}`}
          onClick={() => setTheme(opt.mode)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function RatingInput({
  value,
  onChange,
  readOnly = false,
}: {
  value: number | undefined;
  onChange?: (rating: number | undefined) => void;
  readOnly?: boolean;
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="rating-input" aria-label={`評価 ${value ?? 0}/5`}>
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          className={`star-button ${value && n <= value ? "filled" : ""}`}
          disabled={readOnly}
          onClick={() => onChange?.(value === n ? undefined : n)}
          aria-label={`${n}`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

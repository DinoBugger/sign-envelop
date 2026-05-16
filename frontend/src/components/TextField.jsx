export default function TextField({ label, hint, error, className = "", ...props }) {
  return (
    <label className={["field", className].filter(Boolean).join(" ")}>
      <span className="field__label">{label}</span>
      <input className={error ? "field__input field__input--error" : "field__input"} {...props} />
      {hint ? <span className="field__hint">{hint}</span> : null}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}

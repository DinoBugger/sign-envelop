export default function Button({ children, variant = "primary", type = "button", disabled = false, className = "", ...props }) {
  const buttonClassName = ["app-button", `app-button--${variant}`, className].filter(Boolean).join(" ");

  return (
    <button type={type} className={buttonClassName} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

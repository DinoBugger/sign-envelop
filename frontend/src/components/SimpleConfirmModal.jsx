import React from "react";
import Button from "./Button.jsx";

export default function SimpleConfirmModal({
  open,
  title = "Xác nhận",
  description = "Bạn có chắc chắn muốn tiếp tục?",
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  onConfirm,
  onCancel,
  confirmLoading = false,
}) {
  if (!open) return null;

  return (
    <div className="key-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div className="key-modal__backdrop" onClick={onCancel} aria-hidden="true" />
      <div className="key-modal__panel">
        <div className="key-modal__header">
          <div>
            <p className="page-eyebrow">{title}</p>
            <h3 id="confirm-modal-title">{title}</h3>
          </div>
          <button type="button" className="key-modal__close" onClick={onCancel} aria-label="Đóng modal">
            ×
          </button>
        </div>

        <div className="key-modal__content">
          <p>{description}</p>
        </div>

        <div className="key-modal__footer">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={confirmLoading}>
            {cancelLabel}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={confirmLoading}>
            {confirmLoading ? "Đang xử lý..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

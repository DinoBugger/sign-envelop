import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../components/Button.jsx";
import TextField from "../components/TextField.jsx";
import SimpleConfirmModal from "../components/SimpleConfirmModal.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { generateMyKeyPair, getMyKeys, revokeMyKey } from "../services/keyService.js";

const translateKeyError = (message) => {
  const translations = {
    "Failed to fetch keys": "Không thể tải danh sách khóa.",
    "Failed to generate key": "Không thể tạo khóa mới.",
    "Failed to revoke key": "Không thể vô hiệu hóa khóa.",
    "Key not found": "Không tìm thấy khóa.",
    "Not authorized to revoke this key": "Bạn không có quyền vô hiệu hóa khóa này.",
    "Active key already exists. Revoke the current key before generating a new one.": "Bạn vẫn còn khóa active. Vui lòng thu hồi khóa hiện tại trước khi tạo khóa mới.",
    "PIN code must be exactly 6 digits": "Mã PIN phải gồm đúng 6 chữ số.",
  };

  return translations[message] || message;
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const maskKeyText = (value) => {
  if (!value) {
    return "";
  }

  const compact = value.replace(/\r?\n/g, "\n").trim();
  if (compact.length <= 64) {
    return compact.replace(/.(?=.{8})/g, "*");
  }

  const visiblePrefix = compact.slice(0, 34);
  const visibleSuffix = compact.slice(-34);
  return `${visiblePrefix}${"*".repeat(Math.max(compact.length - visiblePrefix.length - visibleSuffix.length, 12))}${visibleSuffix}`;
};

const downloadBinaryFile = (base64Content, fileName) => {
  const binaryContent = window.atob(base64Content);
  const bytes = new Uint8Array(binaryContent.length);

  for (let index = 0; index < binaryContent.length; index += 1) {
    bytes[index] = binaryContent.charCodeAt(index);
  }

  const blob = new Blob([bytes], { type: "application/octet-stream" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

const copyTextToClipboard = async (value) => {
  if (navigator.clipboard?.writeText) {
    // Cách hiện đại
    return navigator.clipboard.writeText(value);
  }
  // fallback nếu trang web chạy trên giao thức http thường
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
};

export default function KeyManagementPage() {
  const navigate = useNavigate();
  const { accessToken, currentUser } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [revokePendingId, setRevokePendingId] = useState("");
  const [generatedKeyPair, setGeneratedKeyPair] = useState(null);
  const [pinModal, setPinModal] = useState({ open: false, pin: "", error: "" });
  const [confirmRevoke, setConfirmRevoke] = useState({ open: false, keyId: null });

  const activeKey = useMemo(() => keys.find((key) => key.status === "active") || null, [keys]);
  const hasAnyKey = keys.length > 0;
  const hasOnlyRevokedKeys = hasAnyKey && !activeKey;

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
      return;
    }

    const loadKeys = async () => {
      try {
        const response = await getMyKeys(accessToken);
        setKeys(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        toast.error(translateKeyError(error.message));
      } finally {
        setLoading(false);
      }
    };

    loadKeys();
  }, [accessToken, navigate]);

  const refreshKeys = async () => {
    const response = await getMyKeys(accessToken);
    setKeys(Array.isArray(response.data) ? response.data : []);
  };

  const openPinModal = () => {
    setPinModal({ open: true, pin: "", error: "" });
  };

  const closePinModal = () => {
    if (isGenerating) {
      return;
    }

    setPinModal({ open: false, pin: "", error: "" });
  };

  const handlePinChange = (event) => {
    const nextPin = event.target.value.replace(/\D/g, "").slice(0, 6);
    setPinModal((current) => ({ ...current, pin: nextPin, error: "" }));
  };

  const handleCreateKey = async () => {
    if (!/^\d{6}$/.test(pinModal.pin)) {
      setPinModal((current) => ({
        ...current,
        error: "Mã PIN phải gồm đúng 6 chữ số.",
      }));
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateMyKeyPair(accessToken, pinModal.pin);
      setGeneratedKeyPair(response.data);
      if (response.data?.encryptedPrivateKeyBase64) {
        downloadBinaryFile(response.data.encryptedPrivateKeyBase64, response.data.privateKeyFileName || `private-key-${response.data.id || new Date().toISOString().replace(/[:.]/g, "-")}.bin`);
      }
      setPinModal({ open: false, pin: "", error: "" });
      await refreshKeys();
      toast.success("Đã tạo cặp khóa mới.");
    } catch (error) {
      toast.error(translateKeyError(error.message));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyFingerprint = async (fingerprint) => {
    try {
      await copyTextToClipboard(fingerprint);
      toast.success("Đã sao chép fingerprint.");
    } catch {
      toast.error("Không thể sao chép fingerprint.");
    }
  };

  const requestRevokeKey = (keyId) => {
    setConfirmRevoke({ open: true, keyId });
  };

  const cancelRevoke = () => {
    setConfirmRevoke({ open: false, keyId: null });
  };

  const doRevokeKey = async (keyId) => {
    if (!keyId) return;
    setRevokePendingId(keyId);
    try {
      await revokeMyKey(accessToken, keyId);
      await refreshKeys();
      toast.success("Đã vô hiệu hóa khóa đang active.");
    } catch (error) {
      toast.error(translateKeyError(error.message));
    } finally {
      setRevokePendingId("");
      setConfirmRevoke({ open: false, keyId: null });
    }
  };

  if (loading) {
    return (
      <div className="page-card">
        <div className="page-heading">
          <p className="page-eyebrow">Khóa cá nhân</p>
          <h2>Đang tải dữ liệu khóa...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page-card key-page">
      <div className="page-heading key-page__header">
        <div>
          <p className="page-eyebrow">Khóa cá nhân</p>
          <h2>Quản lý cặp khóa RSA</h2>
          <p>Chúng tôi sẽ lưu lại khóa công khai của bạn, vui lòng tải khóa bí mật và lưu trên thiết bị cục bộ của bạn.</p>
        </div>

        <div className="key-page__actions">
          <Button type="button" variant="secondary" onClick={() => navigate("/")}>
            Về trang chủ
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/profile")}>
            Hồ sơ
          </Button>
        </div>
      </div>

      <div className="key-page__summary">
        <div className="key-summary-card">
          <span>Người dùng</span>
          <strong>{currentUser?.username || "-"}</strong>
        </div>
        <div className="key-summary-card">
          <span>Tỉnh / thành phố</span>
          <strong>{currentUser?.province || "-"}</strong>
        </div>
        <div className="key-summary-card">
          <span>Trạng thái hiện tại</span>
          <strong>{activeKey ? "Có khóa active" : "Không có khóa active"}</strong>
        </div>
        <div className="key-summary-card">
          <span>Số lượng khóa</span>
          <strong>{keys.length}</strong>
        </div>
      </div>

      <div className="key-note">
        <strong>Lưu ý:</strong>
        <span>Nếu nghi ngờ bị lộ khóa bí mật, thì hãy thu hồi cặp khóa hiện tại, và tạo cặp khóa mới.</span>
      </div>

      {hasOnlyRevokedKeys ? (
        <div className="key-empty-state">
          <h3>Bạn chỉ còn các khóa đã bị thu hồi.</h3>
          <p>Hãy tạo lại một cặp khóa mới để tiếp tục sử dụng hệ thống.</p>
          <Button type="button" onClick={openPinModal} disabled={isGenerating}>
            {isGenerating ? "Đang tạo..." : "Tạo lại khóa mới"}
          </Button>
        </div>
      ) : null}

      {!hasAnyKey ? (
        <div className="key-empty-state">
          <h3>Bạn chưa có khóa nào.</h3>
          <p>Nhấn nút bên dưới để tạo cặp khóa mới và tải khóa bí mật về thiết bị của bạn.</p>
          <Button type="button" onClick={openPinModal} disabled={isGenerating}>
            {isGenerating ? "Đang tạo..." : "Tạo khóa"}
          </Button>
        </div>
      ) : null}

      {hasAnyKey ? (
        <div className="key-grid">
          {keys.map((key) => (
            <article className={`key-card ${key.status === "active" ? "key-card--active" : ""}`} key={key._id}>
              <div className="key-card__header">
                <div>
                  <p className="key-card__label">Fingerprint</p>
                  <div className="key-card__fingerprint-row">
                    <h3>{key.fingerprint}</h3>
                    <Button type="button" variant="secondary" className="key-card__copy-button" onClick={() => handleCopyFingerprint(key.fingerprint)}>
                      Sao chép
                    </Button>
                  </div>
                </div>
                <span className={`key-status key-status--${key.status}`}>{key.status === "active" ? "Đang active" : "Đã vô hiệu hóa"}</span>
              </div>

              <div className="key-card__meta-grid">
                <div>
                  <span>Ngày tạo</span>
                  <strong>{formatDate(key.createdAt)}</strong>
                </div>
                <div>
                  <span>Vô hiệu hóa</span>
                  <strong>{formatDate(key.revokedAt)}</strong>
                </div>
              </div>

              <label>Khóa công khai</label>
              <pre>{maskKeyText(key.publicKey)}</pre>

              <div className="key-card__footer">
                {key.status === "active" ? (
                  <Button type="button" variant="secondary" onClick={() => requestRevokeKey(key._id)} disabled={revokePendingId === key._id}>
                    {revokePendingId === key._id ? "Đang vô hiệu hóa..." : "Vô hiệu hóa khóa active"}
                  </Button>
                ) : (
                  <span className="key-card__muted">Khóa này đã được thu hồi trước đó.</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {generatedKeyPair ? (
        <div className="key-modal" role="dialog" aria-modal="true" aria-labelledby="key-modal-title">
          <div className="key-modal__backdrop" onClick={() => setGeneratedKeyPair(null)} aria-hidden="true" />
          <div className="key-modal__panel">
            <div className="key-modal__header">
              <div>
                <p className="page-eyebrow">Khóa vừa tạo</p>
                <h3 id="key-modal-title">Tải và lưu khóa bí mật ngay bây giờ</h3>
              </div>
              <button type="button" className="key-modal__close" onClick={() => setGeneratedKeyPair(null)} aria-label="Đóng modal">
                ×
              </button>
            </div>

            <p className="key-modal__note">Chúng tôi sẽ lưu lại khóa công khai của bạn, vui lòng tải khóa bí mật và lưu trên thiết bị cục bộ của bạn.</p>

            <div className="key-modal__content">
              <div>
                <label>Public key</label>
                <pre>{maskKeyText(generatedKeyPair.publicKey)}</pre>
              </div>
              <div>
                <label>Tệp tải xuống</label>
                <pre>{generatedKeyPair.privateKeyFileName || "private-key.bin"}</pre>
              </div>
            </div>

            <div className="key-modal__footer">
              <Button type="button" onClick={() => setGeneratedKeyPair(null)}>
                Đã tải tệp .bin
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {pinModal.open ? (
        <div className="key-modal" role="dialog" aria-modal="true" aria-labelledby="pin-modal-title">
          <div className="key-modal__backdrop" onClick={closePinModal} aria-hidden="true" />
          <div className="key-modal__panel key-modal__panel--compact">
            <div className="key-modal__header">
              <div>
                <p className="page-eyebrow">Tạo khóa mới</p>
                <h3 id="pin-modal-title">Nhập mã PIN 6 số</h3>
              </div>
              <button type="button" className="key-modal__close" onClick={closePinModal} aria-label="Đóng modal">
                ×
              </button>
            </div>

            <p className="key-modal__note">PIN này sẽ dùng để mã hóa private key RSA-2048 trước khi tải về dưới dạng tệp .bin.</p>

            <form
              className="key-modal__content"
              onSubmit={(event) => {
                event.preventDefault();
                handleCreateKey();
              }}
            >
              <TextField
                label="Mã PIN"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Nhập 6 chữ số"
                maxLength={6}
                value={pinModal.pin}
                onChange={handlePinChange}
                hint="Chỉ chấp nhận đúng 6 chữ số. Hãy lưu PIN này để giải mã private key sau này."
                error={pinModal.error}
              />

              <div className="key-modal__footer">
                <Button type="button" variant="secondary" onClick={closePinModal} disabled={isGenerating}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isGenerating || pinModal.pin.length !== 6}>
                  {isGenerating ? "Đang tạo..." : "Tiếp tục"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <SimpleConfirmModal
        open={confirmRevoke.open}
        title="Xác nhận thu hồi"
        description="Bạn có chắc muốn vô hiệu hóa khóa đang active không?"
        confirmLabel="Vô hiệu hóa"
        cancelLabel="Hủy"
        onConfirm={() => doRevokeKey(confirmRevoke.keyId)}
        onCancel={cancelRevoke}
        confirmLoading={revokePendingId === confirmRevoke.keyId}
      />
    </div>
  );
}

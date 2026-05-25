import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../components/Button.jsx";
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

const downloadPemFile = (pemContent, fileName) => {
  const blob = new Blob([pemContent], { type: "application/x-pem-file" });
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

  const handleCreateKey = async () => {
    setIsGenerating(true);
    try {
      const response = await generateMyKeyPair(accessToken);
      setGeneratedKeyPair(response.data);
      if (response.data?.privateKey) {
        const fingerprint = response.data.id || new Date().toISOString().replace(/[:.]/g, "-");
        downloadPemFile(response.data.privateKey, `private-key-${fingerprint}.pem`);
      }
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

  const handleRevokeKey = async (keyId) => {
    const confirmed = window.confirm("Bạn có chắc muốn vô hiệu hóa khóa đang active không?");
    if (!confirmed) {
      return;
    }

    setRevokePendingId(keyId);
    try {
      await revokeMyKey(accessToken, keyId);
      await refreshKeys();
      toast.success("Đã vô hiệu hóa khóa đang active.");
    } catch (error) {
      toast.error(translateKeyError(error.message));
    } finally {
      setRevokePendingId("");
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
        <span>Nếu nghi ngờ bị lộ khóa bí mật, thì hãy thu hồi cặp khóa hiện tại.</span>
      </div>

      {hasOnlyRevokedKeys ? (
        <div className="key-empty-state">
          <h3>Bạn chỉ còn các khóa đã bị thu hồi.</h3>
          <p>Hãy tạo lại một cặp khóa mới để tiếp tục sử dụng hệ thống.</p>
          <Button type="button" onClick={handleCreateKey} disabled={isGenerating}>
            {isGenerating ? "Đang tạo..." : "Tạo lại khóa mới"}
          </Button>
        </div>
      ) : null}

      {!hasAnyKey ? (
        <div className="key-empty-state">
          <h3>Bạn chưa có khóa nào.</h3>
          <p>Nhấn nút bên dưới để tạo cặp khóa mới và tải khóa bí mật về thiết bị của bạn.</p>
          <Button type="button" onClick={handleCreateKey} disabled={isGenerating}>
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
                  <Button type="button" variant="secondary" onClick={() => handleRevokeKey(key._id)} disabled={revokePendingId === key._id}>
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
                <label>Private key</label>
                <pre>{maskKeyText(generatedKeyPair.privateKey)}</pre>
              </div>
            </div>

            <div className="key-modal__footer">
              <Button type="button" onClick={() => setGeneratedKeyPair(null)}>
                Đã lưu khóa bí mật
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

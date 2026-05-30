import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../components/Button.jsx";
import TextField from "../components/TextField.jsx";
import SimpleConfirmModal from "../components/SimpleConfirmModal.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { generateMyCertificate, getMyCertificates, revokeMyCertificate } from "../services/certificateService.js";

const translateCertificateError = (message) => {
  const translations = {
    "Failed to fetch certificates": "Không thể tải danh sách chứng thư.",
    "Failed to generate certificate": "Không thể tạo chứng thư mới.",
    "Failed to revoke certificate": "Không thể vô hiệu hóa chứng thư.",
    "Certificate not found": "Không tìm thấy chứng thư.",
    "Not authorized to revoke this certificate": "Bạn không có quyền vô hiệu hóa chứng thư này.",
    "Active certificate already exists. Revoke the current certificate before generating a new one.": "Bạn vẫn còn chứng thư active. Vui lòng thu hồi chứng thư hiện tại trước khi tạo chứng thư mới.",
    "PIN code must be exactly 6 digits": "Mã PIN phải gồm đúng 6 chữ số.",
  };

  return translations[message] || message;
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
};

const maskText = (value) => {
  if (!value) return "";
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
    return navigator.clipboard.writeText(value);
  }

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

export default function CertificateManagementPage() {
  const navigate = useNavigate();
  const { accessToken, currentUser } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [revokePendingId, setRevokePendingId] = useState("");
  const [generatedCertificate, setGeneratedCertificate] = useState(null);
  const [pinModal, setPinModal] = useState({ open: false, pin: "", error: "" });
  const [confirmRevoke, setConfirmRevoke] = useState({ open: false, certificateId: null });

  const activeCertificate = useMemo(() => certificates.find((certificate) => certificate.status === "active") || null, [certificates]);
  const hasAnyCertificate = certificates.length > 0;
  const hasOnlyRevokedCertificates = hasAnyCertificate && !activeCertificate;

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
      return;
    }

    const loadCertificates = async () => {
      try {
        const response = await getMyCertificates(accessToken);
        setCertificates(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        toast.error(translateCertificateError(error.message));
      } finally {
        setLoading(false);
      }
    };

    loadCertificates();
  }, [accessToken, navigate]);

  const refreshCertificates = async () => {
    const response = await getMyCertificates(accessToken);
    setCertificates(Array.isArray(response.data) ? response.data : []);
  };

  const openPinModal = () => setPinModal({ open: true, pin: "", error: "" });

  const closePinModal = () => {
    if (isGenerating) return;
    setPinModal({ open: false, pin: "", error: "" });
  };

  const handlePinChange = (event) => {
    const nextPin = event.target.value.replace(/\D/g, "").slice(0, 6);
    setPinModal((current) => ({ ...current, pin: nextPin, error: "" }));
  };

  const handleCreateCertificate = async () => {
    if (!/^\d{6}$/.test(pinModal.pin)) {
      setPinModal((current) => ({ ...current, error: "Mã PIN phải gồm đúng 6 chữ số." }));
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateMyCertificate(accessToken, pinModal.pin);
      setGeneratedCertificate(response.data);
      if (response.data?.encryptedPrivateKeyBase64) {
        downloadBinaryFile(response.data.encryptedPrivateKeyBase64, response.data.privateKeyFileName || `private-key-${response.data.id || new Date().toISOString().replace(/[:.]/g, "-")}.bin`);
      }
      setPinModal({ open: false, pin: "", error: "" });
      await refreshCertificates();
      toast.success("Đã tạo chứng thư mới.");
    } catch (error) {
      toast.error(translateCertificateError(error.message));
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

  const requestRevokeCertificate = (certificateId) => {
    setConfirmRevoke({ open: true, certificateId });
  };

  const cancelRevoke = () => {
    setConfirmRevoke({ open: false, certificateId: null });
  };

  const doRevokeCertificate = async (certificateId) => {
    if (!certificateId) return;
    setRevokePendingId(certificateId);
    try {
      await revokeMyCertificate(accessToken, certificateId);
      await refreshCertificates();
      toast.success("Đã vô hiệu hóa chứng thư đang active.");
    } catch (error) {
      toast.error(translateCertificateError(error.message));
    } finally {
      setRevokePendingId("");
      setConfirmRevoke({ open: false, certificateId: null });
    }
  };

  if (loading) {
    return (
      <div className="page-card">
        <div className="page-heading">
          <p className="page-eyebrow">Chứng thư số</p>
          <h2>Đang tải dữ liệu chứng thư...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page-card key-page">
      <div className="page-heading key-page__header">
        <div>
          <p className="page-eyebrow">Chứng thư số</p>
          <h2>Quản lý chứng thư RSA</h2>
          <p>Hệ thống sẽ lưu chứng thư công khai của bạn, vui lòng tải khóa bí mật được mã hóa và lưu trên thiết bị cục bộ.</p>
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
          <strong>{activeCertificate ? "Có chứng thư active" : "Không có chứng thư active"}</strong>
        </div>
        <div className="key-summary-card">
          <span>Số lượng chứng thư</span>
          <strong>{certificates.length}</strong>
        </div>
      </div>

      <div className="key-note">
        <strong>Lưu ý:</strong>
        <span>Nếu nghi ngờ bị lộ khóa bí mật, hãy thu hồi chứng thư hiện tại rồi tạo chứng thư mới.</span>
      </div>

      {hasOnlyRevokedCertificates ? (
        <div className="key-empty-state">
          <h3>Bạn chỉ còn các chứng thư đã bị thu hồi.</h3>
          <p>Hãy tạo lại một chứng thư mới để tiếp tục sử dụng hệ thống.</p>
          <Button type="button" onClick={openPinModal} disabled={isGenerating}>
            {isGenerating ? "Đang tạo..." : "Tạo lại chứng thư mới"}
          </Button>
        </div>
      ) : null}

      {!hasAnyCertificate ? (
        <div className="key-empty-state">
          <h3>Bạn chưa có chứng thư nào.</h3>
          <p>Nhấn nút bên dưới để tạo chứng thư mới và tải khóa bí mật được mã hóa về thiết bị của bạn.</p>
          <Button type="button" onClick={openPinModal} disabled={isGenerating}>
            {isGenerating ? "Đang tạo..." : "Tạo chứng thư"}
          </Button>
        </div>
      ) : null}

      {hasAnyCertificate ? (
        <div className="key-grid">
          {certificates.map((certificate) => (
            <article className={`key-card ${certificate.status === "active" ? "key-card--active" : ""}`} key={certificate._id}>
              <div className="key-card__header">
                <div>
                  <p className="key-card__label">Fingerprint</p>
                  <div className="key-card__fingerprint-row">
                    <h3>{certificate.fingerprint}</h3>
                    <Button type="button" variant="secondary" className="key-card__copy-button" onClick={() => handleCopyFingerprint(certificate.fingerprint)}>
                      Sao chép
                    </Button>
                  </div>
                </div>
                <span className={`key-status key-status--${certificate.status}`}>{certificate.status === "active" ? "Đang active" : "Đã vô hiệu hóa"}</span>
              </div>

              <div className="key-card__meta-grid">
                <div>
                  <span>Ngày tạo</span>
                  <strong>{formatDate(certificate.createdAt)}</strong>
                </div>
                <div>
                  <span>Vô hiệu hóa</span>
                  <strong>{formatDate(certificate.revokedAt)}</strong>
                </div>
                <div>
                  <span>Hết hạn</span>
                  <strong>{formatDate(certificate.validUntil)}</strong>
                </div>
              </div>

              <label>Chứng thư công khai</label>
              <pre>{maskText(certificate.publicKey)}</pre>

              <div className="key-card__footer">
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Button type="button" variant="secondary" onClick={() => navigate(`/certificates/${certificate._id}`)}>
                    Xem chi tiết
                  </Button>
                  {certificate.status === "active" ? (
                    <Button type="button" variant="secondary" onClick={() => requestRevokeCertificate(certificate._id)} disabled={revokePendingId === certificate._id}>
                      {revokePendingId === certificate._id ? "Đang vô hiệu hóa..." : "Vô hiệu hóa chứng thư active"}
                    </Button>
                  ) : (
                    <span className="key-card__muted">Chứng thư này đã được thu hồi trước đó.</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {generatedCertificate ? (
        <div className="key-modal" role="dialog" aria-modal="true" aria-labelledby="key-modal-title">
          <div className="key-modal__backdrop" onClick={() => setGeneratedCertificate(null)} aria-hidden="true" />
          <div className="key-modal__panel">
            <div className="key-modal__header">
              <div>
                <p className="page-eyebrow">Chứng thư vừa tạo</p>
                <h3 id="key-modal-title">Tải và lưu khóa bí mật ngay bây giờ</h3>
              </div>
              <button type="button" className="key-modal__close" onClick={() => setGeneratedCertificate(null)} aria-label="Đóng modal">
                ×
              </button>
            </div>

            <p className="key-modal__note">Chúng tôi đã tạo chứng thư mới cho bạn. Vui lòng tải khóa bí mật được mã hóa dưới dạng tệp .bin.</p>

            <div className="key-modal__content">
              <div>
                <label>Public key</label>
                <pre>{maskText(generatedCertificate.publicKey)}</pre>
              </div>
              <div>
                <label>Tệp tải xuống</label>
                <pre>{generatedCertificate.privateKeyFileName || "private-key.bin"}</pre>
              </div>
            </div>

            <div className="key-modal__footer">
              <Button type="button" onClick={() => setGeneratedCertificate(null)}>
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
                <p className="page-eyebrow">Tạo chứng thư mới</p>
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
                handleCreateCertificate();
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
        description="Bạn có chắc muốn vô hiệu hóa chứng thư đang active không?"
        confirmLabel="Vô hiệu hóa"
        cancelLabel="Hủy"
        onConfirm={() => doRevokeCertificate(confirmRevoke.certificateId)}
        onCancel={cancelRevoke}
        confirmLoading={revokePendingId === confirmRevoke.certificateId}
      />
    </div>
  );
}

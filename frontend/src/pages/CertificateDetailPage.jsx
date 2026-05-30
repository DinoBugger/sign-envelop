import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../components/Button.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { getCertificateById } from "../services/certificateService.js";

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
};

const maskText = (value) => {
  if (!value) return "";
  const compact = value.trim();
  if (compact.length <= 120) return compact;
  return `${compact.slice(0, 90)}...${compact.slice(-24)}`;
};

export default function CertificateDetailPage() {
  const navigate = useNavigate();
  const { certificateId } = useParams();
  const { accessToken } = useAuth();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
      return;
    }

    const loadCertificate = async () => {
      try {
        const response = await getCertificateById(accessToken, certificateId);
        setCertificate(response.data || null);
      } catch (error) {
        toast.error(error.message || "Không thể tải chi tiết chứng thư.");
      } finally {
        setLoading(false);
      }
    };

    loadCertificate();
  }, [accessToken, certificateId, navigate]);

  if (loading) {
    return (
      <div className="page-card">
        <p>Đang tải chi tiết chứng thư...</p>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="page-card">
        <p>Không tìm thấy chứng thư.</p>
        <Button type="button" onClick={() => navigate("/certificates")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="page-card">
      <div className="page-heading">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <p className="page-eyebrow" style={{ fontSize: "30px" }}>
              Chi tiết chứng thư
            </p>
            <p style={{ marginTop: "0.5rem", color: "var(--muted)" }}>Mã chứng thư: {certificate.certSerialNumber}</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button type="button" variant="secondary" onClick={() => navigate("/certificates")}>
              Quay lại danh sách
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/profile")}>
              Hồ sơ
            </Button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        <div>
          <strong>Chủ thể:</strong> {certificate.subjectName}
        </div>
        <div>
          <strong>Email:</strong> {certificate.subjectEmail}
        </div>
        <div>
          <strong>Tỉnh / thành phố:</strong> {certificate.subjectProvince || "-"}
        </div>
        <div>
          <strong>Serial number:</strong> {certificate.userSerialNumber}
        </div>
        <div>
          <strong>Fingerprint:</strong> {certificate.fingerprint}
        </div>
        <div>
          <strong>Trạng thái:</strong> {certificate.status}
        </div>
        <div>
          <strong>Hiệu lực từ:</strong> {formatDate(certificate.validFrom)}
        </div>
        <div>
          <strong>Hiệu lực đến:</strong> {formatDate(certificate.validUntil)}
        </div>
        <div>
          <strong>Ngày thu hồi:</strong> {formatDate(certificate.revokedAt)}
        </div>
        <div>
          <strong>Public key:</strong>
          <pre>{maskText(certificate.publicKey)}</pre>
        </div>
        <div>
          <strong>Raw certificate:</strong>
          <pre>{maskText(certificate.rawCertificate)}</pre>
        </div>
        <div>
          <strong>Liên kết:</strong> <Link to="/certificates">Danh sách chứng thư</Link>
        </div>
      </div>
    </div>
  );
}

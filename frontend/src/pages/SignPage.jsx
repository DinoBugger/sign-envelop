import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../components/Button.jsx";
import TextField from "../components/TextField.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { getMyCertificates } from "../services/certificateService.js";

const PIN_LENGTH = 6;

export default function SignPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [form, setForm] = useState({ documentFile: null, privateKeyFile: null, pin: "" });
  const [fileErrors, setFileErrors] = useState({ documentFile: "", privateKeyFile: "" });
  const [isCheckingCertificate, setIsCheckingCertificate] = useState(true);

  const pinError = useMemo(() => {
    if (!form.pin) {
      return "";
    }

    return /^\d{6}$/.test(form.pin) ? "" : "Mã PIN phải gồm đúng 6 chữ số.";
  }, [form.pin]);

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    const file = files?.[0] || null;
    let errorMessage = "";

    const pinError = !form.pin || /^\d{6}$/.test(form.pin) ? "" : "Mã PIN phải gồm đúng 6 chữ số.";
    if (file) {
      if (name === "documentFile") {
        const isPdf = file.name.toLowerCase().endsWith(".pdf");
        if (!isPdf) {
          errorMessage = "Tài liệu chỉ hỗ trợ định dạng pdf";
        }
      }

      if (name === "privateKeyFile") {
        const isBin = file.name.toLowerCase().endsWith(".bin");
        if (!isBin) {
          errorMessage = "Vui lòng tải về đúng định dạng file khóa mật (.bin)";
        }
      }
    }

    setFileErrors((current) => ({ ...current, [name]: errorMessage }));

    setForm((current) => ({
      ...current,
      [name]: errorMessage ? null : file,
    }));
  };

  const handlePinChange = (event) => {
    const nextPin = event.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
    setForm((current) => ({ ...current, pin: nextPin }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (fileErrors.documentFile || fileErrors.privateKeyFile || pinError) return;
  };

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
      return;
    }

    let isMounted = true;

    const checkActiveCertificate = async () => {
      try {
        const response = await getMyCertificates(accessToken);
        const certificates = Array.isArray(response.data) ? response.data : [];
        const hasActiveCertificate = certificates.some((certificate) => certificate.status === "active");

        if (!hasActiveCertificate) {
          toast.warning("Bạn cần có chứng thư còn hiệu lực trước khi ký tài liệu. Hãy tạo hoặc kích hoạt chứng thư trong mục Chứng thư.", {
            toastId: "sign-page-active-certificate-required",
          });
          navigate("/certificates", { replace: true });
          return;
        }

        if (isMounted) {
          setIsCheckingCertificate(false);
        }
      } catch (error) {
        if (error?.message === "You are not logged in!" || error?.message === "Token is invalid or expired!") {
          navigate("/login", { replace: true });
          return;
        }

        toast.error(error.message || "Không thể kiểm tra chứng thư active.");
        navigate("/certificates", { replace: true });
      }
    };

    checkActiveCertificate();

    return () => {
      isMounted = false;
    };
  }, [accessToken, navigate]);

  if (isCheckingCertificate) {
    return (
      <main className="page-shell">
        <section className="page-card sign-page">
          <div className="page-heading">
            <p className="page-eyebrow">Ký tài liệu</p>
            <h2>Đang kiểm tra chứng thư active...</h2>
            <p>Hệ thống đang xác nhận bạn có chứng thư hợp lệ để tiếp tục ký tài liệu.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="page-card sign-page">
        <div className="page-heading">
          <p className="page-eyebrow">Ký tài liệu</p>
          <p>Tải file PDF, chọn file private-key.bin và nhập mã PIN 6 số để chuẩn bị ký.</p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit} autoComplete="off">
          <TextField label="File PDF" name="documentFile" type="file" accept=".pdf,application/pdf" onChange={handleFileChange} hint="Chỉ chấp nhận file .pdf" className="field--file" />

          <TextField
            label="Private key"
            name="privateKeyFile"
            type="file"
            accept=".bin,application/octet-stream"
            onChange={handleFileChange}
            hint="Chỉ chấp nhận file private-key.bin"
            className="field--file"
          />

          <TextField
            label="Mã PIN"
            name="pin"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={form.pin}
            onChange={handlePinChange}
            error={pinError}
            placeholder="000000"
            maxLength={PIN_LENGTH}
          />

          <div className="sign-page__summary" aria-live="polite">
            <p>
              Tài liệu: <strong>{form.documentFile ? form.documentFile.name : "Chưa chọn file"}</strong>
            </p>
            <p>
              Private key: <strong>{form.privateKeyFile ? form.privateKeyFile.name : "Chưa chọn file"}</strong>
            </p>
          </div>

          <div className="sign-page__actions">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Quay lại
            </Button>
            <Button type="submit" disabled={!form.documentFile || !form.privateKeyFile || !/^\d{6}$/.test(form.pin)}>
              Tiếp tục
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}

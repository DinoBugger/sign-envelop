import { Link } from "react-router-dom";
import avatarDefault from "../assets/avatar-default.svg";
import { useAuth } from "../hooks/useAuth.js";

const flowSteps = [
  {
    number: "01",
    title: "Đăng ký và đăng nhập",
    description: "Tạo tài khoản bằng username, email và password để bắt đầu sử dụng hệ thống.",
  },
  {
    number: "02",
    title: "Tạo cặp khóa RSA",
    description: "Sinh private key để giữ riêng trên máy và public key để phục vụ xác thực.",
  },
  {
    number: "03",
    title: "Ký tài liệu",
    description: "Hash nội dung bằng SHA-256 rồi gắn chữ ký số vào tài liệu.",
  },
  {
    number: "04",
    title: "Xác thực chữ ký",
    description: "Bên nhận dùng public key để kiểm tra tính toàn vẹn và nguồn gốc tài liệu.",
  },
];

const featureCards = [
  {
    title: "RSA 4096-bit",
    description: "Private key không rời khỏi thiết bị của bạn, public key được dùng để xác thực.",
  },
  {
    title: "SHA-256",
    description: "Mỗi tài liệu có hash riêng, chỉ cần đổi một ký tự là phát hiện được thay đổi.",
  },
  {
    title: "Profile công khai",
    description: "Public key có thể được tra cứu từ profile để hỗ trợ xác thực tài liệu.",
  },
  {
    title: "Xác thực độc lập",
    description: "Người nhận tự kiểm tra chữ ký mà không cần phụ thuộc vào bên trung gian.",
  },
  {
    title: "Node.js + MongoDB",
    description: "Backend lưu trữ khóa và dữ liệu người dùng linh hoạt, dễ mở rộng.",
  },
  {
    title: "Nhiều định dạng tài liệu",
    description: "Hỗ trợ nhiều loại tài liệu khác nhau theo cùng một quy trình ký số.",
  },
];

export default function HomePage() {
  const { accessToken, currentUser, logout } = useAuth();

  return (
    <main className="home-page">
      <header className="home-nav">
        <div>
          <p className="home-brand-mark">Sign Envelop</p>
          <p className="home-brand-sub">Nền tảng ký số tài liệu an toàn</p>
        </div>

        <nav className="home-nav-links" aria-label="Điều hướng trang chủ">
          <a href="#features">Tính năng</a>
          <a href="#flow">Luồng ký</a>
          <a href="#security">Bảo mật</a>
        </nav>

        {accessToken && currentUser ? (
          <div className="home-user-chip">
            <img className="home-user-avatar" src={avatarDefault} alt="Avatar mặc định" />
            <div>
              <span>Xin chào</span>
              <strong>{currentUser.username}</strong>
            </div>
            <button className="home-button home-button--ghost home-user-logout" type="button" onClick={logout}>
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="home-nav-actions">
            <Link className="home-button home-button--ghost" to="/login">
              Đăng nhập
            </Link>
            <Link className="home-button home-button--primary" to="/register">
              Bắt đầu miễn phí
            </Link>
          </div>
        )}
      </header>

      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-kicker">RSA · SHA-256 · PKI</p>
          <h1>Ký số tài liệu an toàn, minh bạch và khó bị giả mạo.</h1>
          <p className="home-lead">
            Sign Envelop giúp bạn tạo cặp khóa RSA, ký tài liệu và xác thực chữ ký điện tử bằng public key. Cách trình bày đơn giản, nhưng vẫn giữ đúng ý tưởng bảo mật của bản mẫu.
          </p>

          <div className="home-hero-actions">
            <Link className="home-button home-button--primary" to="/register">
              Tạo tài khoản ngay
            </Link>
            <a className="home-button home-button--ghost" href="#flow">
              Xem luồng hoạt động
            </a>
          </div>

          <div className="home-mini-stats" aria-label="Thông tin nhanh">
            <div>
              <span>Private key</span>
              <strong>Giữ riêng trên máy</strong>
            </div>
            <div>
              <span>Public key</span>
              <strong>Dùng để xác thực</strong>
            </div>
          </div>

          {accessToken && currentUser ? (
            <div className="home-user-banner">
              <img className="home-user-banner__avatar" src={avatarDefault} alt="Avatar mặc định" />
              <div>
                <p className="home-user-banner__label">Đã đăng nhập</p>
                <strong>{currentUser.username}</strong>
              </div>
            </div>
          ) : null}
        </div>

        <div className="home-hero-panel" aria-label="Minh họa tài liệu ký số">
          <article className="document-card document-card--valid">
            <div className="document-card__header">
              <div>
                <p className="document-card__title">hop-dong-dich-vu-2024.pdf</p>
                <p className="document-card__meta">20/05/2026 · 14:32 ICT</p>
              </div>
              <span className="status-pill status-pill--success">Hợp lệ</span>
            </div>
            <p className="document-card__label">SHA-256 hash</p>
            <p className="document-card__hash">a3f8c2d91e4b7056f...</p>
          </article>

          <article className="signature-card">
            <p className="signature-card__label">Chữ ký điện tử</p>
            <h2>Nguyễn Văn An</h2>
            <p className="signature-card__meta">4096-bit RSA · ID: 0x7F2A…</p>
          </article>

          <article className="document-card document-card--pending">
            <div className="document-card__header">
              <div>
                <p className="document-card__title">bao-cao-tai-chinh-q1.docx</p>
                <p className="document-card__meta">20/05/2026 · 09:15 ICT</p>
              </div>
              <span className="status-pill status-pill--warning">Chờ ký</span>
            </div>
            <p className="document-card__label">SHA-256 hash</p>
            <p className="document-card__hash">Sẽ được tạo sau khi ký</p>
          </article>
        </div>
      </section>

      <section className="home-section" id="flow">
        <div className="section-heading">
          <p className="section-kicker">Luồng hoạt động</p>
          <h2>Ký tài liệu và xác thực theo từng bước rõ ràng.</h2>
        </div>

        <div className="step-grid">
          {flowSteps.map((step) => (
            <article className="step-card" key={step.number}>
              <p className="step-card__number">{step.number}</p>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section" id="features">
        <div className="section-heading section-heading--split">
          <div>
            <p className="section-kicker">Tính năng</p>
            <h2>Đơn giản để dùng, vẫn giữ tinh thần bảo mật của bản gốc.</h2>
          </div>
          <p>Nội dung được trình bày gọn hơn file mẫu nhưng vẫn bám các ý chính: ký số, hash, public key, profile và xác thực tài liệu.</p>
        </div>

        <div className="feature-grid">
          {featureCards.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-section--cta" id="security">
        <div>
          <p className="section-kicker">Bảo mật</p>
          <h2>Bắt đầu ký số ngay hôm nay.</h2>
          <p>Tạo tài khoản miễn phí, sinh cặp khóa RSA và thử luồng ký tài liệu đầu tiên trong vài phút.</p>
        </div>

        <div className="home-hero-actions">
          <Link className="home-button home-button--primary" to="/register">
            Tạo tài khoản miễn phí
          </Link>
          <Link className="home-button home-button--ghost" to="/login">
            Đăng nhập
          </Link>
        </div>
      </section>

      <footer className="home-footer">
        <p>© 2026 Sign Envelop · RSA · SHA-256 · PKI</p>
        <div>
          <a href="#features">Tính năng</a>
          <a href="#flow">Luồng ký</a>
          <a href="#security">Bảo mật</a>
        </div>
      </footer>
    </main>
  );
}

import { Link } from "react-router-dom";
import avatarDefault from "../assets/avatar-default.svg";
import { useAuth } from "../hooks/useAuth.js";

const flowSteps = [
  {
    number: "01",
    title: "Đăng ký và đăng nhập",
    description: "Tạo tài khoản bằng tên người dùng, email và mật khẩu để bắt đầu sử dụng hệ thống.",
  },
  {
    number: "02",
    title: "Tạo cặp khóa RSA",
    description: "Sinh khóa riêng để giữ trên máy và khóa công khai để phục vụ xác thực.",
  },
  {
    number: "03",
    title: "Ký tài liệu",
    description: "Tạo băm SHA-256 cho nội dung rồi gắn chữ ký số vào tài liệu.",
  },
  {
    number: "04",
    title: "Xác thực chữ ký",
    description: "Người nhận dùng khóa công khai để kiểm tra tính toàn vẹn và nguồn gốc tài liệu.",
  },
];

const featureCards = [
  {
    title: "RSA 4096 bit",
    description: "Khóa riêng không rời khỏi thiết bị của bạn, khóa công khai được dùng để xác thực.",
  },
  {
    title: "Băm SHA-256",
    description: "Mỗi tài liệu có mã băm riêng, chỉ cần đổi một ký tự là phát hiện được thay đổi.",
  },
  {
    title: "Hồ sơ công khai",
    description: "Khóa công khai có thể được tra cứu từ hồ sơ để hỗ trợ xác thực tài liệu.",
  },
  {
    title: "Xác thực độc lập",
    description: "Người nhận tự kiểm tra chữ ký mà không cần phụ thuộc vào bên trung gian.",
  },
  {
    title: "Node.js và MongoDB",
    description: "Backend lưu trữ khóa và dữ liệu người dùng linh hoạt, dễ mở rộng.",
  },
  {
    title: "Nhiều định dạng tài liệu",
    description: "Hỗ trợ nhiều loại tài liệu khác nhau theo cùng một quy trình ký số.",
  },
];

export default function HomePage() {
  const { accessToken, currentUser, logout } = useAuth();
  const isAuthenticated = Boolean(accessToken && currentUser);

  return (
    <main className="home-page">
      <header className="home-nav">
        <div>
          <p className="home-brand-mark">Sign Envelop</p>
          <p className="home-brand-sub">Nền tảng ký số tài liệu an toàn</p>
        </div>

        <nav className="home-nav-links" aria-label="Điều hướng trang chủ">
          <a href="#sign-document">Kí tài liệu</a>
          <a href="#verify-signature">Xác thực chữ kí</a>
          <a href="#flow">Luồng ký</a>
          <Link to="/keys">Khóa cá nhân</Link>
        </nav>

        {accessToken && currentUser ? (
          <div className="home-user-chip">
            <img className="home-user-avatar" src={avatarDefault} alt="Avatar mặc định" />
            <div>
              <span>Xin chào</span>
              <strong>{currentUser.username}</strong>
            </div>
            <Link className="home-button home-button--ghost" to="/profile">
              Hồ sơ
            </Link>
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
        <div className="home-hero-panel" aria-label="Hai tính năng chính của hệ thống">
          <article className="home-feature-panel home-feature-panel--sign" id="sign-document">
            <p className="home-feature-panel__kicker">Kí tài liệu</p>
            <h2>Tạo chữ ký số từ khóa riêng</h2>
            <p>Ký tài liệu nhanh, giữ khóa riêng trên máy và phát hành chữ ký để người khác kiểm tra.</p>
            <a className="home-button home-button--primary" href="#sign-document">
              Kí tài liệu ngay
            </a>
          </article>

          <article className="home-feature-panel home-feature-panel--verify" id="verify-signature">
            <p className="home-feature-panel__kicker">Xác thực chữ kí</p>
            <h2>Kiểm tra bằng khóa công khai</h2>
            <p>Dùng tài liệu và khóa công khai để xác minh tính toàn vẹn, nguồn gốc và phát hiện sửa đổi.</p>
            <a className="home-button home-button--ghost" href="#verify-signature">
              Xác thực ngay
            </a>
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
          <p>Nội dung được trình bày gọn hơn file mẫu nhưng vẫn bám các ý chính: ký số, mã băm, khóa công khai, hồ sơ người dùng và xác thực tài liệu.</p>
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

      {!isAuthenticated && (
        <section className="home-section home-section--cta" id="security">
          <div>
            <p className="section-kicker">Bắt đầu nhanh</p>
            <h2>Sẵn sàng thử ký tài liệu và xác thực chữ ký.</h2>
            <p>Tạo tài khoản miễn phí để dùng ngay hai tính năng chính của hệ thống.</p>
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
      )}

      <footer className="home-footer">
        <p>© 2026 Sign Envelop · RSA · SHA-256 · PKI</p>
        <div>
          <a href="#sign-document">Kí tài liệu</a>
          <a href="#verify-signature">Xác thực chữ kí</a>
          <a href="#flow">Luồng ký</a>
        </div>
      </footer>
    </main>
  );
}

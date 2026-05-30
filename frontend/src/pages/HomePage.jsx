import { Link } from "react-router-dom";
import avatarDefault from "../assets/avatar-default.svg";
import signStage from "../assets/sign-stage.jpg";
import verifyStage from "../assets/verify-stage.jpg";
import { useAuth } from "../hooks/useAuth.js";

const processStages = [
  {
    id: "sign-document",
    eyebrow: "Quy trình ký",
    title: "Ký tài liệu bằng khóa riêng",
    description: "Băm nội dung bằng SHA-256, sau đó dùng RSA-2048 để tạo chữ ký số gắn với tài liệu.",
    image: signStage,
    alt: "Sơ đồ quy trình ký số với bước băm và mã hóa chữ ký",
    chips: ["Thuật toán hash: Băm SHA-256", "Thuật toán mã hóa: RSA-2048"],
  },
  {
    id: "verify-signature",
    eyebrow: "Quy trình xác thực",
    title: "Xác thực bằng khóa công khai",
    description: "Giải mã chữ ký bằng RSA-2048, tạo lại hash SHA-256 và so sánh hai giá trị để kiểm tra tính hợp lệ.",
    image: verifyStage,
    alt: "Sơ đồ quy trình xác thực chữ ký số với so sánh hai giá trị băm",
    chips: ["Thuật toán hash: Băm SHA-256", "Thuật toán mã hóa: RSA-2048"],
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
          <a href="#process">Quy trình</a>
          <Link to="/certificates">Chứng thư</Link>
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

      <section className="home-section" id="quick-actions">
        <div className="section-heading section-heading--split">
          <div>
            <p className="section-kicker">Thao tác nhanh</p>
            <h2>Hai chức năng chính để đi thẳng vào việc.</h2>
          </div>
        </div>

        <div className="home-hero-panel" aria-label="Hai chức năng chính của hệ thống">
          <article className="home-feature-panel home-feature-panel--sign">
            <p className="home-feature-panel__kicker">Kí tài liệu</p>
            <h2>Nhập khóa cá nhân và kí tài liệu</h2>
            <p>Chữ kí được nhúng vào metadata của tài liệu</p>
            <Link className="home-button home-button--primary" to={isAuthenticated ? "/sign" : "/login"}>
              {isAuthenticated ? "Kí ngay" : "Đăng nhập để dùng"}
            </Link>
          </article>

          <article className="home-feature-panel home-feature-panel--verify">
            <p className="home-feature-panel__kicker">Xác thực chữ kí</p>
            <h2>Tải file lên và được kiểm tra chữ kí</h2>
            <p>Kiểm định chữ kí và nội dung tài liệu không bị thay đổi</p>
            <Link className="home-button home-button--ghost" to={isAuthenticated ? "/profile" : "/login"}>
              {isAuthenticated ? "Xác thực ngay" : "Đăng nhập để dùng"}
            </Link>
          </article>
        </div>
      </section>

      <section className="home-section home-section--process" id="process">
        <div className="section-heading section-heading--split">
          <div>
            <p className="section-kicker">Quy trình chính</p>
            <h2>Hai ảnh mô tả đầy đủ luồng ký và xác thực.</h2>
          </div>
        </div>

        <div className="process-grid">
          {processStages.map((stage) => (
            <article className={`process-card process-card--${stage.id === "sign-document" ? "sign" : "verify"}`} id={stage.id} key={stage.id}>
              <div className="process-card__media">
                <img className="process-card__image" src={stage.image} alt={stage.alt} />
              </div>

              <div className="process-card__content">
                <p className="section-kicker">{stage.eyebrow}</p>
                <h3>{stage.title}</h3>
                <p>{stage.description}</p>

                <div className="process-card__chips">
                  {stage.chips.map((chip) => (
                    <span className="process-chip" key={chip}>
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <p>© 2026 Sign Envelop · RSA-2048 · SHA-256 · PKI</p>
        <div>
          <a href="#sign-document">Quy trình ký</a>
          <a href="#verify-signature">Quy trình xác thực</a>
          <a href="#process">Tổng quan</a>
        </div>
      </footer>
    </main>
  );
}

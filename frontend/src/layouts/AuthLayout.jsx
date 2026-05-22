import { Link, NavLink, Outlet } from "react-router-dom";
import { useRedirectIfAuthenticated } from "../hooks/useRedirectIfAuthenticated.js";

export default function AuthLayout() {
  useRedirectIfAuthenticated();

  return (
    <div className="app-shell auth-shell">
      <aside className="app-hero auth-hero">
        <p className="app-kicker">HỆ THỐNG SIGN ENVELOP</p>
        <h1>Đăng ký hoặc đăng nhập để tiếp tục.</h1>
        <p className="app-lede">Tạo tài khoản bằng tên người dùng, email và mật khẩu. Sau đó đăng nhập bằng email và mật khẩu để vào trang chính.</p>

        <div className="auth-note-grid">
          <article className="auth-note-card">
            <span>Đăng ký</span>
            <strong>Tên người dùng + Email + Mật khẩu</strong>
          </article>
          <article className="auth-note-card">
            <span>Đăng nhập</span>
            <strong>Email + Mật khẩu</strong>
          </article>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-nav">
          <nav>
            <NavLink to="/login" className={({ isActive }) => (isActive ? "app-nav__link is-active" : "app-nav__link")}>
              Đăng nhập
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => (isActive ? "app-nav__link is-active" : "app-nav__link")}>
              Đăng ký
            </NavLink>
          </nav>
          <Link to="/" className="app-brand">
            Trang chủ
          </Link>
        </header>

        <section className="app-panel">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

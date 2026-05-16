import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function AuthLayout() {
  const { accessToken, isBootstrapping, userMessage } = useAuth();

  return (
    <div className="app-shell">
      <aside className="app-hero">
        <p className="app-kicker">Node Auth System</p>
        <h1>React + Vite auth UI for register and login.</h1>
        <p className="app-lede">Registration is username + email + password. Login uses email + password, and the backend refresh cookie keeps the session alive.</p>

        <div className="app-stat-grid">
          <article className="app-stat-card">
            <span>Status</span>
            <strong>{isBootstrapping ? "Bootstrapping" : accessToken ? "Authenticated" : "Anonymous"}</strong>
          </article>
          <article className="app-stat-card">
            <span>Session</span>
            <strong>{accessToken ? `${accessToken.slice(0, 18)}...` : "No token"}</strong>
          </article>
        </div>

        <p className="app-message">{userMessage}</p>
      </aside>

      <main className="app-main">
        <header className="app-nav">
          <nav>
            <NavLink to="/login" className={({ isActive }) => (isActive ? "app-nav__link is-active" : "app-nav__link")}>
              Login
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => (isActive ? "app-nav__link is-active" : "app-nav__link")}>
              Register
            </NavLink>
          </nav>
          <Link to="/login" className="app-brand">
            auth-ui
          </Link>
        </header>

        <section className="app-panel">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

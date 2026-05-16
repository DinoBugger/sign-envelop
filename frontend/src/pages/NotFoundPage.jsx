import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="auth-page" aria-labelledby="not-found-title">
      <section className="auth-card" role="status" aria-live="polite">
        <h1 id="not-found-title">404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link to="/login">Back to Login</Link>
      </section>
    </main>
  );
}

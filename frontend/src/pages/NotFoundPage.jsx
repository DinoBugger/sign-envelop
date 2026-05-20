import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="auth-page" aria-labelledby="not-found-title">
      <section className="auth-card" role="status" aria-live="polite">
        <h1 id="not-found-title">404 - Không tìm thấy trang</h1>
        <p>Trang bạn đang tìm không tồn tại.</p>
        <Link to="/login">Quay lại đăng nhập</Link>
      </section>
    </main>
  );
}

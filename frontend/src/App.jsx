import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { useAuth } from "./hooks/useAuth.js";
import AuthLayout from "./layouts/AuthLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import OTPVerifyPage from "./pages/OTPVerifyPage.jsx";
import CertificateDetailPage from "./pages/CertificateDetailPage.jsx";
import CertificateManagementPage from "./pages/CertificateManagementPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SignPage from "./pages/SignPage.jsx";
import "react-toastify/dist/ReactToastify.css";

function AppRoutes() {
  const { isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="boot-screen" role="status" aria-live="polite" aria-busy="true">
        <div className="boot-screen__card">
          <div className="boot-screen__spinner" aria-hidden="true" />
          <p className="boot-screen__title">Đang khôi phục phiên đăng nhập...</p>
          <p className="boot-screen__text">Vui lòng chờ trong giây lát để hệ thống đồng bộ trạng thái tài khoản.</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/certificates" element={<CertificateManagementPage />} />
      <Route path="/certificates/:certificateId" element={<CertificateDetailPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/sign" element={<SignPage />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<OTPVerifyPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ToastContainer position="top-center" autoClose={2800} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable theme="dark" />
    </AuthProvider>
  );
}

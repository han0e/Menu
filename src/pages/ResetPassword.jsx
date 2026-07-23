import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useModal } from "../context/ModalContext";
import { useNavigate } from "react-router-dom";
import "../index.css";

const EyeIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 18-.722-3.25" />
    <path d="M2 8a10.645 10.645 0 0 0 20 0" />
    <path d="m20 15-1.726-2.05" />
    <path d="m4 15 1.726-2.05" />
    <path d="m9 18 .722-3.25" />
  </svg>
);

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const { showAlert: showCustomAlert } = useModal();

  const showAlert = (title, message, onConfirm = null) => {
    showCustomAlert(title, message, onConfirm);
  };

  const getErrorMessage = (message) => {
    if (!message) return "알 수 없는 오류가 발생했습니다.";
    const msg = message.toLowerCase();
    if (msg.includes("should be different")) {
      return "새 비밀번호는 기존 비밀번호와 다르게 설정해 주세요.";
    }
    if (msg.includes("password should be at least")) {
      return "비밀번호는 최소 6자 이상이어야 합니다.";
    }
    return message;
  };

  useEffect(() => {
    // When arriving from the email link, Supabase will process the URL hash
    // and establish a temporary session if the link is valid.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionInfo(session);
      } else {
        showAlert(
          "세션 만료",
          "유효하지 않은 링크이거나 세션이 만료되었습니다.\n다시 시도해주세요.",
          () => {
            navigate("/login");
          },
        );
      }
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      showAlert("알림", "비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      showAlert("변경 실패", getErrorMessage(error.message));
    } else {
      showAlert("변경 성공", "비밀번호가 성공적으로 변경되었습니다!", () => {
        navigate("/");
      });
    }
    setLoading(false);
  };

  if (!sessionInfo) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "var(--bg)",
          color: "var(--gold-bright)",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo-wrap">
          <img
            src="/logo2.png"
            alt="Aaron's Roll N Comb"
            className="login-logo"
          />
        </div>
        <p className="login-subtitle">새 비밀번호 설정</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>새 비밀번호</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="새로운 비밀번호를 입력하세요"
                required
                style={{ paddingRight: "40px", width: "100%" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.35)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                }}
              >
                {showPassword ? <EyeIcon /> : <EyeClosedIcon />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>새 비밀번호 확인</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showPasswordConfirm ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="새로운 비밀번호를 다시 입력하세요"
                required
                style={{ paddingRight: "40px", width: "100%" }}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.35)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                }}
              >
                {showPasswordConfirm ? <EyeIcon /> : <EyeClosedIcon />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "변경 중..." : "비밀번호 변경하기"}
          </button>
        </form>
      </div>
    </div>
  );
}

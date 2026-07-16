import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../index.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const showAlert = (title, message, onConfirm = null) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
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

  if (!sessionInfo && !modalConfig.isOpen) {
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="새로운 비밀번호를 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label>새 비밀번호 확인</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="새로운 비밀번호를 다시 입력하세요"
              required
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "변경 중..." : "비밀번호 변경하기"}
          </button>
        </form>
      </div>

      {modalConfig.isOpen && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div
            className="modal-content"
            style={{
              textAlign: "center",
              padding: "30px",
              maxWidth: "420px",
              width: "90%",
            }}
          >
            <h2
              style={{
                color: "var(--gold-bright)",
                fontSize: "20px",
                marginBottom: "8px",
              }}
            >
              {modalConfig.title}
            </h2>
            <div className="panel-rule" style={{ marginBottom: "20px" }}>
              <span className="pr-line"></span>
              <span className="pr-gem">◆</span>
              <span className="pr-line"></span>
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "var(--txt-100)",
                marginBottom: "30px",
                whiteSpace: "pre-line",
                lineHeight: "1.6",
                textAlign: "center",
              }}
            >
              {modalConfig.message}
            </p>
            <div
              className="modal-actions"
              style={{ display: "flex", justifyContent: "center" }}
            >
              <button
                className="submit-btn"
                style={{ maxWidth: "160px", padding: "12px", width: "100%" }}
                onClick={() => {
                  const cb = modalConfig.onConfirm;
                  setModalConfig((prev) => ({ ...prev, isOpen: false }));
                  cb?.();
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

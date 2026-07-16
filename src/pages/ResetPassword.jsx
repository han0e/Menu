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

  useEffect(() => {
    // When arriving from the email link, Supabase will process the URL hash
    // and establish a temporary session if the link is valid.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionInfo(session);
      } else {
        alert(
          "유효하지 않은 링크이거나 세션이 만료되었습니다. 다시 시도해주세요.",
        );
        navigate("/login");
      }
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      alert("비밀번호 변경 실패: " + error.message);
    } else {
      alert("비밀번호가 성공적으로 변경되었습니다!");
      navigate("/");
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
    </div>
  );
}

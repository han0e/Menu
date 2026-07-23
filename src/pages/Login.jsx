import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useModal } from "../context/ModalContext";
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

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [designerName, setDesignerName] = useState("");
  const [loading, setLoading] = useState(false);
  const { showAlert: showCustomAlert } = useModal();
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [modalType, setModalType] = useState(null); // 'terms' | 'privacy' | null
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const getErrorMessage = (message) => {
    if (!message) return "알 수 없는 오류가 발생했습니다.";

    const msg = message.toLowerCase();

    if (
      msg.includes("invalid login credentials") ||
      msg.includes("invalid credentials")
    ) {
      return "이메일 주소 또는 비밀번호가 잘못되었습니다.";
    }
    if (msg.includes("email not confirmed")) {
      return "이메일 인증이 완료되지 않았습니다.\n\n메일함을 확인해주세요.";
    }
    if (msg.includes("user not found")) {
      return "가입되지 않은 이메일 주소입니다.";
    }
    if (msg.includes("invalid email")) {
      return "올바른 이메일 형식이 아닙니다.";
    }
    if (msg.includes("rate limit")) {
      return "너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해 주세요.";
    }
    if (msg.includes("password should be at least")) {
      return "비밀번호는 최소 6자 이상이어야 합니다.";
    }
    if (
      msg.includes("user already registered") ||
      msg.includes("already exists")
    ) {
      return "이미 가입된 이메일 주소입니다.";
    }
    if (msg.includes("for security purposes")) {
      const match = msg.match(/after (\d+) seconds/);
      const sec = match ? match[1] : "15";
      return `보안을 위해 ${sec}초 후에 다시 시도해 주세요.`;
    }

    return message;
  };

  const showAlert = (title, message) => {
    const translatedMessage = getErrorMessage(message);
    showCustomAlert(title, translatedMessage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      showAlert(
        "알림",
        "Supabase is not configured yet. Please check .env file.",
      );
      return;
    }

    setLoading(true);

    if (isResetMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) {
        showAlert("이메일 전송 실패", getErrorMessage(error.message));
      } else {
        showAlert(
          "전송 성공",
          "비밀번호 재설정 이메일이 발송되었습니다. \n 메일함을 확인해주세요!",
        );
        setIsResetMode(false);
      }
      setLoading(false);
      return;
    }

    if (isSignUp) {
      if (!designerName.trim()) {
        showAlert("알림", "디자이너명을 입력해주세요.");
        setLoading(false);
        return;
      }
      if (password !== passwordConfirm) {
        showAlert("알림", "비밀번호가 일치하지 않습니다.");
        setLoading(false);
        return;
      }
      if (!agreeTerms || !agreePrivacy) {
        showAlert(
          "알림",
          "필수 이용약관 및 개인정보 처리방침에 모두 동의해주셔야 가입이 가능합니다.",
        );
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: designerName,
          },
        },
      });
      if (error) {
        showAlert("회원가입 실패", getErrorMessage(error.message));
      } else {
        showAlert(
          "회원가입 완료",
          "회원가입 신청이 성공적으로 완료되었습니다!\n\n입력하신 이메일로 발송된 인증 링크를 \n 누르신 후에 로그인을 진행해 주세요. \n\n *메일이 보이지 않는 경우 \n스팸 메일함 확인 부탁드립니다.",
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        showAlert("로그인 실패", getErrorMessage(error.message));
      }
    }

    setLoading(false);
  };

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
        <p className="login-subtitle">
          {isResetMode ? "비밀번호 찾기" : "Designer Portal"}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          {!isResetMode && isSignUp && (
            <div className="form-group">
              <label>디자이너명</label>
              <input
                type="text"
                value={designerName}
                onChange={(e) => setDesignerName(e.target.value)}
                placeholder="예: Aaron 원장"
                required={isSignUp}
              />
            </div>
          )}

          <div className="form-group">
            <label>이메일 주소</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="예: designer@example.com"
              required
            />
          </div>

          {!isResetMode && (
            <div className="form-group">
              <label>비밀번호</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
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
          )}

          {!isResetMode && isSignUp && (
            <div className="form-group">
              <label>비밀번호 확인</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showPasswordConfirm ? "text" : "password"}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  required={isSignUp}
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
          )}

          {!isResetMode && isSignUp && (
            <div
              className="terms-container"
              style={{
                marginTop: "8px",
                border: "1px solid var(--bdr-lo)",
                padding: "12px",
                borderRadius: "8px",
                background: "var(--surface-2)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <label
                className="checkbox-label"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "var(--txt-70)",
                }}
              >
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "var(--gold-main)",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "13px" }}>이용약관 동의 (필수)</span>
                <button
                  type="button"
                  onClick={() => setModalType("terms")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--gold-main)",
                    textDecoration: "underline",
                    cursor: "pointer",
                    marginLeft: "auto",
                    fontSize: "12px",
                    padding: 0,
                  }}
                >
                  보기
                </button>
              </label>

              <label
                className="checkbox-label"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "var(--txt-70)",
                }}
              >
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "var(--gold-main)",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "13px" }}>
                  개인정보 수집 및 이용 동의 (필수)
                </span>
                <button
                  type="button"
                  onClick={() => setModalType("privacy")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--gold-main)",
                    textDecoration: "underline",
                    cursor: "pointer",
                    marginLeft: "auto",
                    fontSize: "12px",
                    padding: 0,
                  }}
                >
                  보기
                </button>
              </label>
            </div>
          )}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading
              ? "처리중..."
              : isResetMode
                ? "재설정 이메일 받기"
                : isSignUp
                  ? "가입하기"
                  : "로그인"}
          </button>
        </form>

        <div className="login-toggle">
          {isResetMode ? (
            <span>
              기억이 났나요?{" "}
              <button onClick={() => setIsResetMode(false)}>
                로그인으로 돌아가기
              </button>
            </span>
          ) : isSignUp ? (
            <span>
              이미 계정이 있으신가요?{" "}
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setAgreeTerms(false);
                  setAgreePrivacy(false);
                }}
              >
                로그인
              </button>
            </span>
          ) : (
            <>
              <span>
                계정이 없으신가요?{" "}
                <button onClick={() => setIsSignUp(true)}>회원가입</button>
              </span>
              <div style={{ marginTop: "10px" }}>
                <button
                  style={{ color: "var(--txt-70)", fontSize: "12px" }}
                  onClick={() => setIsResetMode(true)}
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {modalType && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              textAlign: "left",
            }}
          >
            <h2
              style={{
                color: "var(--gold-bright)",
                fontSize: "20px",
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              {modalType === "terms"
                ? "이용약관"
                : "개인정보 수집 및 이용 방침"}
            </h2>
            <div className="panel-rule" style={{ margin: "4px 0" }}>
              <span className="pr-line"></span>
              <span className="pr-gem">◆</span>
              <span className="pr-line"></span>
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "var(--txt-70)",
                lineHeight: "1.6",
                whiteSpace: "pre-line",
                maxHeight: "40vh",
                overflowY: "auto",
                paddingRight: "8px",
                border: "1px solid var(--bdr-lo)",
                padding: "12px",
                borderRadius: "6px",
                background: "var(--surface-1)",
              }}
            >
              {modalType === "terms"
                ? `[이용약관]

제1조 (목적)
본 약관은 Aaron's Roll N Comb Hair Salon(이하 "회사" 또는 "미용실")이 제공하는 모바일 메뉴판 및 고객 동의서 서명 관리 시스템(이하 "서비스")을 디자이너(이하 "회원")가 이용함에 있어, 회원과 미용실 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
1. "서비스"란 디자이너가 고객에게 시술 메뉴를 제시하고, 합계 금액 및 동의를 받아 전자서명을 수집·기록하는 웹 서비스를 의미합니다.
2. "회원"이란 본 약관에 동의하고 서비스를 이용하는 디자이너를 말합니다.

제3조 (회원의 의무)
1. 회원은 고객의 전자서명을 수집할 때 시술 가격 및 약관에 대해 고객에게 명확히 고지하여야 합니다.
2. 회원은 타인의 명의를 도용하여 가입하거나 허위 사실을 기록해서는 안 됩니다.

제4조 (서비스의 제공 및 변경)
본 서비스는 상시 제공을 원칙으로 하며, 시스템 점검이나 네트워크 장애 등의 사유가 발생할 경우 일시적으로 중단될 수 있습니다.

제5조 (면책 조항)
미용실은 천재지변, 디바이스 오작동, 네트워크 통신 장애 또는 고객의 단순 변심으로 인한 서명 거부 등 회원의 과실로 발생한 손해에 대하여 책임을 지지 않습니다.`
                : `[개인정보 수집 및 이용 방침]

Aaron's Roll N Comb Hair Salon(이하 "미용실")은 개인정보 보호법에 따라 디자이너 및 고객의 개인정보를 보호하고 관련 고충을 원활히 처리할 수 있도록 다음과 같은 처리 방침을 두고 있습니다.

1. 개인정보의 수집 및 이용 목적
- 디자이너(회원) 계정 관리 및 서비스 권한 부여.
- 고객 시술 합의 증빙 데이터(시술 내역, 전자서명 이미지) 기록 및 증명.

2. 수집하는 개인정보 항목
- 디자이너: 이름(디자이너명), 이메일 주소, 비밀번호.
- 고객: 전자서명(사인 이미지), 시술 상세 내역, 시술 일시, 최종 결제 금액, (필요한 경우) 이름 및 연락처.

3. 개인정보의 보유 및 이용 기간
- 디자이너: 회원 탈퇴 시 즉시 파기. (탈퇴 시 이메일 및 비밀번호는 파괴 처리되며 기존 데이터는 익명화됩니다.)
- 고객 서명 및 결제 이력 정보: 시술 동의 증빙 목적에 따라 회원 탈퇴 시까지 보관됩니다. 단, 전자상거래 등에서의 소비자보호에 관한 법률 등 관계 법령의 규정에 의하여 보관할 필요가 있는 경우, 법령에서 정한 일정 기간(거래 기록 및 서명 이력: 5년) 동안 안전하게 보관한 후 파기합니다.

4. 동의 거부 권리 및 불이익
귀하는 개인정보 수집 및 이용에 동의하지 않을 권리가 있습니다. 단, 필수 항목에 동의하지 않으실 경우 서비스 회원가입 및 이용이 제한됩니다.`}
            </div>

            <div
              className="modal-actions"
              style={{ justifyContent: "center", marginTop: "10px" }}
            >
              <button
                className="submit-btn"
                style={{ maxWidth: "160px", padding: "12px" }}
                onClick={() => setModalType(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const SettingsIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginRight: "6px", verticalAlign: "middle", marginBottom: "2px" }}
  >
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const UserIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginRight: "6px", verticalAlign: "middle", marginBottom: "2px" }}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const LogOutIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginRight: "6px", verticalAlign: "middle", marginBottom: "2px" }}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

export default function UserHeaderMenu({ session }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mypageOpen, setMypageOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [newName, setNewName] = useState(
    session?.user?.user_metadata?.display_name || "",
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "alert", // 'alert' | 'confirm'
    onConfirm: null,
  });

  const displayName = session?.user?.user_metadata?.display_name || "디자이너";

  const showCustomAlert = (title, message, onConfirm = null) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "alert",
      onConfirm,
    });
  };

  const showCustomConfirm = (title, message, onConfirm) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "confirm",
      onConfirm,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // 1. 비밀번호 변경 시 기존 비밀번호 검증 (Re-Authentication)
      if (newPassword) {
        if (!currentPassword) {
          alert("비밀번호를 변경하려면 기존 비밀번호를 입력해야 합니다.");
          setIsUpdating(false);
          return;
        }

        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: session?.user?.email,
          password: currentPassword,
        });

        if (reauthError) {
          alert("기존 비밀번호가 일치하지 않습니다.");
          setIsUpdating(false);
          return;
        }
      }

      const updates = {};
      if (newName && newName !== displayName) {
        updates.data = { display_name: newName };
      }
      if (newPassword) {
        updates.password = newPassword;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.auth.updateUser(updates);
        if (error) throw error;
        showCustomAlert("알림", "성공적으로 변경되었습니다.", () => {
          setMypageOpen(false);
          setCurrentPassword("");
          setNewPassword("");
          setDropdownOpen(false);
        });
      } else {
        showCustomAlert("알림", "변경된 내용이 없습니다.");
      }
    } catch (err) {
      showCustomAlert("변경 실패", err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const proceedWithdraw = async () => {
    setIsUpdating(true);
    try {
      const randomPassword =
        Math.random().toString(36) + Math.random().toString(36) + "@@!!11AA";

      // 1. Auth 유저 비밀번호 파괴 및 display_name 익명화 (SMTP 500 에러를 피하기 위해 이메일 변경은 제외)
      // 식별 가능한 이력 보관을 위해 '탈퇴한디자이너_기존이름' 형식으로 저장
      const { error } = await supabase.auth.updateUser({
        password: randomPassword,
        data: {
          display_name: `탈퇴한디자이너_${displayName}`,
          is_deleted: true,
        },
      });

      if (error) throw error;

      // 2. 강제 로그아웃
      await supabase.auth.signOut();

      showCustomAlert(
        "탈퇴 완료",
        "회원 탈퇴 처리가 완료되었습니다.\n그동안 서비스를 이용해 주셔서 감사합니다.",
        () => {
          setMypageOpen(false);
          navigate("/");
        },
      );
    } catch (err) {
      showCustomAlert("탈퇴 실패", "탈퇴 처리 중 실패했습니다: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleWithdraw = () => {
    showCustomConfirm(
      "회원 탈퇴",
      "정말로 탈퇴하시겠습니까?\n\n시술 기록 등 결제 내역은 유지되지만, 디자이너 프로필 정보는 영구 삭제(식별 및 익명화)되며 기존 아이디로 재가입이나 로그인이 불가능합니다.",
      () => {
        showCustomConfirm(
          "최종 확인",
          "정말 탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없습니다.",
          proceedWithdraw,
        );
      },
    );
  };

  return (
    <div className="user-menu-wrap" ref={menuRef}>
      <button
        className="user-menu-btn"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        {displayName}
      </button>

      {dropdownOpen && (
        <div className="user-dropdown">
          <button onClick={() => navigate("/admin/menus")}>
            <SettingsIcon /> 메뉴설정
          </button>
          <button
            onClick={() => {
              setMypageOpen(true);
              setDropdownOpen(false);
            }}
          >
            <UserIcon /> 마이페이지
          </button>
          <button onClick={handleLogout}>
            <LogOutIcon /> 로그아웃
          </button>
        </div>
      )}

      {mypageOpen && (
        <div className="modal-overlay" style={{ zIndex: 9000 }}>
          <div
            className="modal-content"
            style={{ maxWidth: "420px", width: "90%" }}
          >
            <h2 style={{ color: "var(--gold-bright)", marginBottom: "16px" }}>
              마이페이지
            </h2>
            <div className="form-group" style={{ textAlign: "left" }}>
              <label
                style={{
                  display: "block",
                  color: "var(--txt-70)",
                  marginBottom: "6px",
                  fontSize: "13px",
                }}
              >
                이름 (디스플레이 네임)
              </label>
              <input
                type="text"
                className="edit-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div
              style={{
                marginTop: "20px",
                borderTop: "1px solid var(--bdr-lo)",
                paddingTop: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--gold-main)",
                  marginBottom: "12px",
                  fontWeight: 600,
                }}
              >
                비밀번호 변경
              </p>

              <div className="form-group" style={{ textAlign: "left" }}>
                <label
                  style={{
                    display: "block",
                    color: "var(--txt-70)",
                    marginBottom: "6px",
                    fontSize: "13px",
                  }}
                >
                  기존 비밀번호
                </label>
                <input
                  type="password"
                  className="edit-input"
                  placeholder="비밀번호 변경 시에만 입력"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div
                className="form-group"
                style={{ textAlign: "left", marginTop: "12px" }}
              >
                <label
                  style={{
                    display: "block",
                    color: "var(--txt-70)",
                    marginBottom: "6px",
                    fontSize: "13px",
                  }}
                >
                  새 비밀번호
                </label>
                <input
                  type="password"
                  className="edit-input"
                  placeholder="새로운 비밀번호"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div
              className="actions"
              style={{
                marginTop: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                <button
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    background: "var(--gold-dim)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                  onClick={handleUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating ? "저장 중..." : "저장하기"}
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    background: "var(--surface-3)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                  onClick={() => {
                    setMypageOpen(false);
                    setCurrentPassword("");
                    setNewPassword("");
                  }}
                  disabled={isUpdating}
                >
                  취소
                </button>
              </div>
              <button
                type="button"
                className="withdraw-btn"
                onClick={handleWithdraw}
                disabled={isUpdating}
              >
                회원 탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}

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
              style={{ display: "flex", gap: "10px", justifyContent: "center" }}
            >
              {modalConfig.type === "confirm" ? (
                <>
                  <button
                    className="submit-btn"
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "8px",
                      background: "var(--gold-dim)",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      const cb = modalConfig.onConfirm;
                      setModalConfig((prev) => ({ ...prev, isOpen: false }));
                      cb?.();
                    }}
                  >
                    확인
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "8px",
                      background: "var(--surface-3)",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={() =>
                      setModalConfig({ ...modalConfig, isOpen: false })
                    }
                  >
                    취소
                  </button>
                </>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

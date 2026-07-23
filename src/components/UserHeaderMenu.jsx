import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../context/ModalContext";
import { supabase } from "../supabaseClient";
import PatternModal from "./PatternModal";

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
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [patternModalOpen, setPatternModalOpen] = useState(false);
  const { showAlert: showCustomAlert, showConfirm: showCustomConfirm } = useModal();

  const displayName = session?.user?.user_metadata?.display_name || "디자이너";
  const userPattern = session?.user?.user_metadata?.pattern || "";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // 1. 신규 비밀번호 입력 시 일치 여부 및 길이가 검증됨 (기존 비밀번호 입력 제거됨)
      if (newPassword || newPasswordConfirm) {
        if (newPassword !== newPasswordConfirm) {
          showCustomAlert('알림', '신규 비밀번호와 신규 비밀번호 확인이 일치하지 않습니다.');
          setIsUpdating(false);
          return;
        }

        if (newPassword.length < 6) {
          showCustomAlert('알림', '비밀번호는 최소 6자 이상이어야 합니다.');
          setIsUpdating(false);
          return;
        }
      }

      const updates = {};
      if (newName && newName !== displayName) {
        updates.data = { ...session?.user?.user_metadata, display_name: newName };
      }
      if (newPassword) {
        updates.password = newPassword;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.auth.updateUser(updates);
        if (error) throw error;

        // DB 기반 룩북 유지를 위한 디자이너 정보 동기화 (Upsert)
        if (newName && newName !== displayName) {
          await supabase.from('designers').upsert([{ id: session.user.id, display_name: newName }]);
        }

        showCustomAlert("알림", "성공적으로 변경되었습니다.", () => {
          setMypageOpen(false);
          setNewPassword("");
          setNewPasswordConfirm("");
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

      // 2. 룩북 폴더 내 이미지 영구 삭제 (스토리지 용량 확보)
      const folderName = session?.user?.id;
      if (folderName) {
        const { data: lookbookFiles } = await supabase.storage.from('lookbook').list(folderName, { limit: 1000 });
        if (lookbookFiles && lookbookFiles.length > 0) {
          const filesToRemove = lookbookFiles.map(file => `${folderName}/${file.name}`);
          await supabase.storage.from('lookbook').remove(filesToRemove);
        }
      }

      // 3. 강제 로그아웃
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
            <SettingsIcon /> 설정
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

            {/* 비밀번호 변경 섹션 */}
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
                  textAlign: "left",
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
                  신규 비밀번호
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="edit-input"
                    placeholder="신규 비밀번호"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ paddingRight: "40px", width: "100%" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
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
                    {showNewPassword ? <EyeIcon /> : <EyeClosedIcon />}
                  </button>
                </div>
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
                  신규 비밀번호 확인
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showNewPasswordConfirm ? "text" : "password"}
                    className="edit-input"
                    placeholder="신규 비밀번호 확인"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    style={{ paddingRight: "40px", width: "100%" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)}
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
                    {showNewPasswordConfirm ? <EyeIcon /> : <EyeClosedIcon />}
                  </button>
                </div>
              </div>
            </div>

            {/* 패턴 설정/변경 섹션 */}
            <div
              style={{
                marginTop: "20px",
                borderTop: "1px solid var(--bdr-lo)",
                paddingTop: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--gold-main)",
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  패턴 보안 설정
                </p>
                <span
                  style={{
                    fontSize: "12px",
                    color: userPattern ? "#4caf50" : "var(--txt-50)",
                  }}
                >
                  {userPattern ? "● 패턴 설정됨" : "○ 패턴 미설정"}
                </span>
              </div>
              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  background: "var(--surface-3)",
                  border: "1px solid var(--bdr-md)",
                  color: "var(--gold-bright)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginTop: "4px",
                }}
                onClick={() => setPatternModalOpen(true)}
              >
                {userPattern ? "패턴 변경하기" : "신규 패턴 설정하기"}
              </button>
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
                    setNewPassword("");
                    setNewPasswordConfirm("");
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

      {/* Pattern Modal for Change/Setup inside Mypage */}
      <PatternModal
        isOpen={patternModalOpen}
        onClose={() => setPatternModalOpen(false)}
        onSuccess={() => {
          setPatternModalOpen(false);
          showCustomAlert(
            "성공",
            "패턴이 성공적으로 설정/변경되었습니다."
          );
        }}
        mode={userPattern ? "change" : "setup"}
        existingPattern={userPattern}
        session={session}
      />
    </div>
  );
}


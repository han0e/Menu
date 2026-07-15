import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle', marginBottom: '2px' }}>
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle', marginBottom: '2px' }}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const LogOutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle', marginBottom: '2px' }}>
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [newName, setNewName] = useState(session?.user?.user_metadata?.display_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const displayName = session?.user?.user_metadata?.display_name || '디자이너';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
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
        alert('성공적으로 변경되었습니다.');
        setMypageOpen(false);
        setNewPassword('');
        setDropdownOpen(false);
      } else {
        alert('변경된 내용이 없습니다.');
      }
    } catch (err) {
      alert('변경 실패: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="user-menu-wrap" ref={menuRef}>
      <button className="user-menu-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
        {displayName}
      </button>

      {dropdownOpen && (
        <div className="user-dropdown">
          <button onClick={() => navigate('/admin/menus')}>
            <SettingsIcon /> 메뉴설정
          </button>
          <button onClick={() => { setMypageOpen(true); setDropdownOpen(false); }}>
            <UserIcon /> 마이페이지
          </button>
          <button onClick={handleLogout}>
            <LogOutIcon /> 로그아웃
          </button>
        </div>
      )}

      {mypageOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ color: 'var(--gold-bright)', marginBottom: '16px' }}>마이페이지</h2>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', color: 'var(--txt-70)', marginBottom: '8px' }}>이름 (디스플레이 네임)</label>
              <input type="text" className="edit-input" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div className="form-group" style={{ textAlign: 'left', marginTop: '16px' }}>
              <label style={{ display: 'block', color: 'var(--txt-70)', marginBottom: '8px' }}>새 비밀번호 (변경하지 않으려면 비워두세요)</label>
              <input type="password" className="edit-input" placeholder="새로운 비밀번호" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            
            <div className="actions" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--gold-dim)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={handleUpdate} disabled={isUpdating}>{isUpdating ? '저장 중...' : '저장하기'}</button>
              <button style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--surface-3)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={() => setMypageOpen(false)} disabled={isUpdating}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import '../index.css';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [designerName, setDesignerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '' });

  const getErrorMessage = (message) => {
    if (!message) return '알 수 없는 오류가 발생했습니다.';
    
    const msg = message.toLowerCase();
    
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return '이메일 주소 또는 비밀번호가 잘못되었습니다.';
    }
    if (msg.includes('email not confirmed')) {
      return '이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.';
    }
    if (msg.includes('user not found')) {
      return '가입되지 않은 이메일 주소입니다.';
    }
    if (msg.includes('invalid email')) {
      return '올바른 이메일 형식이 아닙니다.';
    }
    if (msg.includes('rate limit')) {
      return '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해 주세요.';
    }
    if (msg.includes('password should be at least')) {
      return '비밀번호는 최소 6자 이상이어야 합니다.';
    }
    if (msg.includes('user already registered') || msg.includes('already exists')) {
      return '이미 가입된 이메일 주소입니다.';
    }
    
    return message;
  };

  const showAlert = (title, message) => {
    const translatedMessage = getErrorMessage(message);
    setModalConfig({ isOpen: true, title, message: translatedMessage });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      showAlert('알림', 'Supabase is not configured yet. Please check .env file.');
      return;
    }

    setLoading(true);

    if (isResetMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) {
        showAlert('이메일 전송 실패', error.message);
      } else {
        showAlert('전송 성공', '비밀번호 재설정 이메일이 발송되었습니다. 메일함을 확인해주세요!');
        setIsResetMode(false);
      }
      setLoading(false);
      return;
    }

    if (isSignUp) {
      if (!designerName.trim()) {
        showAlert('알림', '디자이너명을 입력해주세요.');
        setLoading(false);
        return;
      }
      if (password !== passwordConfirm) {
        showAlert('알림', '비밀번호가 일치하지 않습니다.');
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: designerName
          }
        }
      });
      if (error) {
        showAlert('회원가입 실패', error.message);
      } else {
        showAlert('회원가입 완료', '가입이 완료되었습니다! (이메일 인증을 끈 경우 바로 로그인됩니다.)');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        showAlert('로그인 실패', error.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo-wrap">
          <img src="/logo2.png" alt="Aaron's Roll N Comb" className="login-logo" />
        </div>
        <p className="login-subtitle">
          {isResetMode ? '비밀번호 찾기' : 'Designer Portal'}
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
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                required
              />
            </div>
          )}

          {!isResetMode && isSignUp && (
            <div className="form-group">
              <label>비밀번호 확인</label>
              <input 
                type="password" 
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                required={isSignUp}
              />
            </div>
          )}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? '처리중...' : (isResetMode ? '재설정 이메일 받기' : (isSignUp ? '가입하기' : '로그인'))}
          </button>
        </form>

        <div className="login-toggle">
          {isResetMode ? (
            <span>기억이 났나요? <button onClick={() => setIsResetMode(false)}>로그인으로 돌아가기</button></span>
          ) : isSignUp ? (
            <span>이미 계정이 있으신가요? <button onClick={() => setIsSignUp(false)}>로그인</button></span>
          ) : (
            <>
              <span>계정이 없으신가요? <button onClick={() => setIsSignUp(true)}>회원가입</button></span>
              <div style={{ marginTop: '10px' }}>
                <button style={{ color: 'var(--txt-70)', fontSize: '12px' }} onClick={() => setIsResetMode(true)}>비밀번호를 잊으셨나요?</button>
              </div>
            </>
          )}
        </div>
      </div>

      {modalConfig.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', padding: '30px' }}>
            <h2 style={{ color: 'var(--gold-bright)', fontSize: '24px', marginBottom: '8px' }}>
              {modalConfig.title}
            </h2>
            <div className="panel-rule" style={{ marginBottom: '20px' }}>
              <span className="pr-line"></span><span className="pr-gem">◆</span><span className="pr-line"></span>
            </div>
            <p style={{ fontSize: '16px', color: 'var(--txt-100)', marginBottom: '30px' }}>
              {modalConfig.message}
            </p>
            <div className="modal-actions">
              <button className="submit-btn" onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

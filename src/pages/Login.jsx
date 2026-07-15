import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import '../index.css';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [designerName, setDesignerName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      alert('Supabase is not configured yet. Please check .env file.');
      return;
    }

    setLoading(true);

    const fakeEmail = username.trim() + '@salon-app.com';

    if (isSignUp) {
      if (!designerName.trim()) {
        alert('디자이너명을 입력해주세요.');
        setLoading(false);
        return;
      }
      if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
        options: {
          data: {
            display_name: designerName
          }
        }
      });
      if (error) {
        alert('회원가입 실패: ' + error.message);
      } else {
        alert('가입이 완료되었습니다! (이메일 인증을 끈 경우 바로 로그인됩니다.)');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      });
      if (error) {
        alert('로그인 실패: ' + error.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Aaron's Roll N Comb</h1>
        <p className="login-subtitle">Designer Portal</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          {isSignUp && (
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
            <label>아이디</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="영문, 숫자 (예: aaron123)"
              required
            />
          </div>

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

          {isSignUp && (
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
            {loading ? '처리중...' : (isSignUp ? '가입하기' : '로그인')}
          </button>
        </form>

        <div className="login-toggle">
          {isSignUp ? (
            <span>이미 계정이 있으신가요? <button onClick={() => setIsSignUp(false)}>로그인</button></span>
          ) : (
            <span>계정이 없으신가요? <button onClick={() => setIsSignUp(true)}>회원가입</button></span>
          )}
        </div>
      </div>
    </div>
  );
}

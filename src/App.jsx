import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import MenuAdmin from './pages/MenuAdmin';
import Main from './pages/Main';
import History from './pages/History';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: 'var(--bg)', color: 'var(--gold-bright)' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line>
        </svg>
        <style>
          {`
            @keyframes spin {
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <div style={{ marginTop: '16px', fontFamily: 'var(--serif)', fontSize: '18px', letterSpacing: '1px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/reset-password" 
          element={<ResetPassword />} 
        />
        <Route 
          path="/" 
          element={session ? <Main session={session} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/history" 
          element={session ? <History session={session} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/admin/menus" 
          element={session ? <MenuAdmin session={session} /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </Router>
  );
}

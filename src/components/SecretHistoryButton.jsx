import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PatternModal from './PatternModal';

export default function SecretHistoryButton({ children }) {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const timeoutRef = useRef(null);

  const [patternModalOpen, setPatternModalOpen] = useState(false);
  const [userPattern, setUserPattern] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const fetchUserData = async () => {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUser(session.user);
      setUserPattern(session.user.user_metadata?.pattern || '');
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [patternModalOpen]);

  const handleSecretClick = async () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount === 3) {
      setClickCount(0);
      clearTimeout(timeoutRef.current);
      
      // Refresh user pattern before opening modal
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          setUserPattern(session.user.user_metadata?.pattern || '');
        }
      }
      setPatternModalOpen(true);
    } else {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setClickCount(0);
      }, 1500);
    }
  };

  const handlePatternSuccess = () => {
    setPatternModalOpen(false);
    navigate('/history');
  };

  return (
    <>
      <div onClick={handleSecretClick} style={{ cursor: 'default' }}>
        {children}
      </div>

      <PatternModal
        isOpen={patternModalOpen}
        onClose={() => setPatternModalOpen(false)}
        onSuccess={handlePatternSuccess}
        mode={userPattern ? 'verify' : 'setup'}
        existingPattern={userPattern}
        session={{ user: currentUser }}
      />
    </>
  );
}


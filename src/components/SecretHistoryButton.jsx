import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SecretHistoryButton({ children }) {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const timeoutRef = useRef(null);

  const handleSecretClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount === 3) {
      navigate('/history');
      setClickCount(0);
      clearTimeout(timeoutRef.current);
    } else {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setClickCount(0);
      }, 1500);
    }
  };

  return (
    <div onClick={handleSecretClick} style={{ cursor: 'default' }}>
      {children}
    </div>
  );
}

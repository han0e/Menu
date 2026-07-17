import React, { useState, useRef, useEffect } from 'react';
import '../index.css';

export default function LookbookModal({ isOpen, onClose, item, currentLang, T }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const getLang = (obj) => typeof obj === 'string' ? obj : (obj[currentLang] || obj?.ko || '');
  const name = getLang(item.name_ko ? { ko: item.name_ko, en: item.name_en, zh: item.name_zh } : item.name);
  const desc = getLang(item.desc_ko ? { ko: item.desc_ko, en: item.desc_en, zh: item.desc_zh } : item.desc);
  
  const images = item.image_url ? item.image_url.split(',').map(u => u.trim()).filter(Boolean) : [];

  const handleNext = (e) => {
    e?.stopPropagation?.();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e) => {
    e?.stopPropagation?.();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Swipe logic

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  let timeStr = null;
  if (item.estimated_time) {
    const mins = item.estimated_time;
    if (currentLang === 'ko') timeStr = mins >= 60 ? `${Math.floor(mins/60)}시간 ${mins%60>0 ? `${mins%60}분`:''}` : `${mins}분`;
    else if (currentLang === 'zh') timeStr = mins >= 60 ? `${Math.floor(mins/60)}小时 ${mins%60>0 ? `${mins%60}分钟`:''}` : `${mins}分钟`;
    else timeStr = mins >= 60 ? `${Math.floor(mins/60)}h ${mins%60>0 ? `${mins%60}m`:''}` : `${mins}m`;
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, flexDirection: 'column' }}>
      
      {/* 프레임 없이 허공에 떠 있는 텍스트 */}
      <div style={{ width: '100%', maxWidth: '600px', marginBottom: '16px', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '500', margin: 0, letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          {name}
        </h2>
      </div>

      <div className="modal-content lookbook-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%', padding: 0, overflow: 'hidden', position: 'relative' }}>
        
        {/* 슬릭한 플로팅 닫기 버튼 */}
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '12px', 
            right: '12px', 
            background: 'transparent', 
            border: 'none', 
            color: '#fff', 
            cursor: 'pointer', 
            zIndex: 20,
            padding: '8px'
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>

        {/* 메인 이미지 */}
        <div 
          className="lookbook-image-container" 
          style={{ width: '100%', height: '60vh', minHeight: '350px', maxHeight: '550px', backgroundColor: '#111', position: 'relative' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {images.length > 0 ? (
            <>
              {images.map((imgUrl, idx) => (
                <img 
                  key={idx}
                  src={imgUrl.trim()} 
                  alt={name} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    opacity: currentIndex === idx ? 1 : 0,
                    transition: 'opacity 0.4s ease-in-out'
                  }} 
                />
              ))}
              
              {images.length > 1 && (
                <>
                  <button onClick={handlePrev} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', zIndex: 10, padding: '12px' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button onClick={handleNext} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', zIndex: 10, padding: '12px' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </>
              )}
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt-50)' }}>
              이미지가 없습니다.
            </div>
          )}
        </div>

        {/* 썸네일 스트립 (이미지가 여러 장일 때만 표시) */}
        {images.length > 1 && (
          <div style={{ 
            width: '100%', 
            padding: '12px 16px', 
            background: 'var(--surface-1)', 
            borderTop: '1px solid var(--bdr-lo)',
            display: 'flex', 
            gap: '12px', 
            overflowX: 'auto', 
            WebkitOverflowScrolling: 'touch', 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            <style>{`.lookbook-content ::-webkit-scrollbar { display: none; }`}</style>
            {images.map((imgUrl, idx) => (
              <div 
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                style={{
                  width: '64px',
                  height: '64px',
                  flexShrink: 0,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: currentIndex === idx ? '2px solid var(--gold-main)' : '2px solid transparent',
                  opacity: currentIndex === idx ? 1 : 0.4,
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
              >
                <img 
                  src={imgUrl.trim()} 
                  alt={`thumb-${idx}`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

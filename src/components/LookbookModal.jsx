import React, { useState } from 'react';
import '../index.css';

export default function LookbookModal({ isOpen, onClose, item, currentLang, T }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || !item) return null;

  const getLang = (obj) => typeof obj === 'string' ? obj : (obj[currentLang] || obj?.ko || '');
  const name = getLang(item.name_ko ? { ko: item.name_ko, en: item.name_en, zh: item.name_zh } : item.name);
  const desc = getLang(item.desc_ko ? { ko: item.desc_ko, en: item.desc_en, zh: item.desc_zh } : item.desc);
  
  const images = item.image_url ? item.image_url.split(',').map(u => u.trim()).filter(Boolean) : [];

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
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
            top: '16px', 
            right: '16px', 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            background: 'rgba(0,0,0,0.4)', 
            border: '1px solid rgba(255,255,255,0.15)', 
            color: '#fff', 
            fontSize: '18px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer', 
            zIndex: 20,
            backdropFilter: 'blur(4px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          ✕
        </button>

        {/* 메인 이미지 */}
        <div className="lookbook-image-container" style={{ width: '100%', height: '65vh', minHeight: '400px', maxHeight: '600px', backgroundColor: '#111', position: 'relative' }}>


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
                  <button onClick={handlePrev} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '20px', cursor: 'pointer', zIndex: 10 }}>❮</button>
                  <button onClick={handleNext} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '20px', cursor: 'pointer', zIndex: 10 }}>❯</button>
                  <div style={{ position: 'absolute', bottom: '10px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 10 }}>
                    {images.map((_, idx) => (
                      <div key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx === currentIndex ? 'var(--gold-main)' : 'rgba(255,255,255,0.5)' }} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt-50)' }}>
              이미지가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

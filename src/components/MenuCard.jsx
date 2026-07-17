import React from 'react';

export default function MenuCard({ item, idx, currentLang, isSelected, toggleItem, onOpenLookbook, T }) {
  const getLang = (obj) => typeof obj === 'string' ? obj : (obj[currentLang] || obj.ko);
  const t = (key) => T[currentLang][key];
  const fmt = n => n.toLocaleString('ko-KR');

  const name = getLang(item.name);
  
  let timeStr = item.time ? getLang(item.time) : null;
  if (!timeStr && item.estimated_time) {
    const mins = item.estimated_time;
    if (currentLang === 'ko') timeStr = mins >= 60 ? `${Math.floor(mins/60)}시간 ${mins%60>0 ? `${mins%60}분`:''}` : `${mins}분`;
    else if (currentLang === 'zh') timeStr = mins >= 60 ? `${Math.floor(mins/60)}小时 ${mins%60>0 ? `${mins%60}分钟`:''}` : `${mins}分钟`;
    else timeStr = mins >= 60 ? `${Math.floor(mins/60)}h ${mins%60>0 ? `${mins%60}m`:''}` : `${mins}m`;
  }
  const time = timeStr;

  const desc = item.desc ? getLang(item.desc) : null;

  let subs = [];
  if (item.subItems) {
    subs = Array.isArray(item.subItems) ? item.subItems : getLang(item.subItems);
  }

  return (
    <div 
      className={`menu-card ${isSelected ? 'selected' : ''}`} 
      style={{ animationDelay: `${idx * 0.04}s` }}
      onClick={() => toggleItem(item.id)}
    >
      <div className="card-check"><div className="card-check-dot"></div></div>
      <div className="card-top">
        <div className="card-name" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {name}
          {item.image_url && (
            <button 
              className="lookbook-btn" 
              onClick={(e) => { e.stopPropagation(); onOpenLookbook(item); }}
              style={{ 
                background: 'rgba(255, 255, 255, 0.06)', 
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                color: 'var(--txt-70)', 
                padding: '4px 10px', 
                borderRadius: '16px',
                cursor: 'pointer', 
                fontSize: '11px', 
                fontWeight: '500',
                letterSpacing: '0.5px',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                marginLeft: '6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                e.target.style.color = 'var(--txt-100)';
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                e.target.style.color = 'var(--txt-70)';
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
              }}
            >
              Lookbook
            </button>
          )}
        </div>
        <div className="card-price-col">
          <div className="card-price">{fmt(item.price)}</div>
        </div>
      </div>
      <div className="card-meta">
        {time && <span className="time-tag">{t('tagTime')(time)}</span>}
        {item.badge && <span className="badge badge-gold">{item.badge}</span>}
        {!item.membershipEligible && <span className="badge badge-mem-off">{t('tagMemOff')}</span>}
        {item.lengthExtra && <span className="badge badge-extra">{t('tagLenExtra')}</span>}
      </div>
      {desc && <div className="card-desc">{desc}</div>}
      {subs.length > 0 && (
        <div className="card-subs">
          {subs.map((s, i) => <span key={i} className="card-sub">{s}</span>)}
        </div>
      )}
    </div>
  );
}

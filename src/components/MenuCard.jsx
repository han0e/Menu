import React from 'react';

export default function MenuCard({ item, idx, currentLang, isSelected, toggleItem, T }) {
  const getLang = (obj) => typeof obj === 'string' ? obj : (obj[currentLang] || obj.ko);
  const t = (key) => T[currentLang][key];
  const fmt = n => n.toLocaleString('ko-KR');

  const name = getLang(item.name);
  const time = item.time ? getLang(item.time) : null;
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
        <div className="card-name">{name}</div>
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

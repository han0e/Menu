import React from "react";

export default function MenuCard({
  item,
  idx,
  currentLang,
  isSelected,
  toggleItem,
  T,
}) {
  const getLang = (obj) =>
    typeof obj === "string" ? obj : obj[currentLang] || obj.ko;
  const t = (key) => T[currentLang][key];
  const fmt = (n) => n.toLocaleString("ko-KR");

  const name = getLang(item.name);

  let timeStr = item.time ? getLang(item.time) : null;
  if (!timeStr && item.estimated_time) {
    const mins = item.estimated_time;
    if (currentLang === "ko")
      timeStr =
        mins >= 60
          ? `${Math.floor(mins / 60)}시간 ${mins % 60 > 0 ? `${mins % 60}분` : ""}`
          : `${mins}분`;
    else if (currentLang === "zh")
      timeStr =
        mins >= 60
          ? `${Math.floor(mins / 60)}小时 ${mins % 60 > 0 ? `${mins % 60}分钟` : ""}`
          : `${mins}分钟`;
    else
      timeStr =
        mins >= 60
          ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ""}`
          : `${mins}m`;
  }
  const time = timeStr;

  const desc = item.desc ? getLang(item.desc) : null;

  let subs = [];
  if (item.subItems) {
    subs = Array.isArray(item.subItems)
      ? item.subItems
      : getLang(item.subItems);
  }

  return (
    <div
      className={`menu-card ${isSelected ? "selected" : ""}`}
      style={{ animationDelay: `${idx * 0.04}s` }}
      onClick={() => toggleItem(item.id)}
    >
      <div className="card-check">
        <div className="card-check-dot"></div>
      </div>
      <div className="card-top">
        <div
          className="card-name"
          style={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          {name}
        </div>
        <div className="card-price-col">
          <div className="card-price">{fmt(item.price)}</div>
        </div>
      </div>
      <div className="card-meta">
        {time && (
          <span className="time-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {t("tagTime")(time)}
          </span>
        )}
        {item.badge && <span className="badge badge-gold">{item.badge}</span>}
        {!item.membershipEligible && (
          <span className="badge badge-mem-off">{t("tagMemOff")}</span>
        )}
        {item.lengthExtra && (
          <span className="badge badge-extra">{t("tagLenExtra")}</span>
        )}
      </div>
      {desc && <div className="card-desc">{desc}</div>}
      {subs.length > 0 && (
        <div className="card-subs">
          {subs.map((s, i) => (
            <span key={i} className="card-sub">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

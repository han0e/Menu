import React from 'react';

export default function RightPanel({ 
  currentLang, selectedIds, toggleItem, 
  membershipOn, setMembershipOn, 
  customDiscount, setCustomDiscount, 
  resetAll, T, MENU_DATA, onProceed,
  isCartOpen, setIsCartOpen
}) {
  const t = (key) => T[currentLang][key];
  const fmt = n => n.toLocaleString('ko-KR');
  const getLang = (obj) => typeof obj === 'string' ? obj : (obj[currentLang] || obj.ko);

  const getMemRate = item => (!membershipOn || !item.membershipEligible) ? 0 : (item.membershipRate || 0);
  const getItemFinal = item => {
    const afterMem = Math.round(item.price * (1 - getMemRate(item) / 100));
    return Math.round(afterMem * (1 - customDiscount / 100));
  };

  const list = MENU_DATA.filter(i => selectedIds.has(i.id));
  const n = selectedIds.size;

  let subtotal = 0, memDisc = 0, customDisc = 0, totalTime = 0;
  
  list.forEach(item => {
    subtotal += item.price;
    if (item.estimated_time) totalTime += item.estimated_time;
    const mRate = getMemRate(item);
    const afterMem = Math.round(item.price * (1 - mRate / 100));
    const mDiff = item.price - afterMem;
    const cDiff = Math.round(afterMem * customDiscount / 100);
    memDisc += mDiff;
    customDisc += cDiff;
  });

  const totalDisc = memDisc + customDisc;
  const finalTotal = subtotal - totalDisc;

  const totalRate = subtotal > 0 ? ((totalDisc / subtotal) * 100).toFixed(1) : 0;

  let totalTimeStr = null;
  if (totalTime > 0) {
    if (currentLang === 'ko') totalTimeStr = `약 ${totalTime >= 60 ? `${Math.floor(totalTime/60)}시간 ${totalTime%60>0 ? `${totalTime%60}분`:''}` : `${totalTime}분`}`;
    else if (currentLang === 'zh') totalTimeStr = `约 ${totalTime >= 60 ? `${Math.floor(totalTime/60)}小时 ${totalTime%60>0 ? `${totalTime%60}分钟`:''}` : `${totalTime}分钟`}`;
    else totalTimeStr = `About ${totalTime >= 60 ? `${Math.floor(totalTime/60)}h ${totalTime%60>0 ? `${totalTime%60}m`:''}` : `${totalTime}m`}`;
  }

  return (
    <div className={`right-panel ${isCartOpen ? 'open' : ''}`}>
      <div className="right-inner">
        <div className="summary-hd">
          <div className="sh-left">
            <h2 className="summary-title">{t('summaryTitle')}</h2>
            <span className="summary-count">
              {n > 0 ? (currentLang === 'ko' ? `${n}개 선택` : `${n} item${n > 1 ? 's' : ''}`) : t('countNone')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button className="reset-link" onClick={resetAll}>{t('resetBtn')}</button>
            <button className="cart-close-btn" onClick={() => setIsCartOpen && setIsCartOpen(false)}>×</button>
          </div>
        </div>

        <div className="sel-list">
          {list.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✦</span>
              <p className="empty-txt">{t('emptyTxt')}</p>
              <p className="empty-sub">{t('emptySub')}</p>
            </div>
          ) : (
            list.map(item => {
              const name = getLang(item.name);
              const finalP = getItemFinal(item);
              const mRate = getMemRate(item);
              const afterMem = Math.round(item.price * (1 - mRate / 100));
              const mDiff = item.price - afterMem;
              const cDiff = Math.round(afterMem * customDiscount / 100);

              return (
                <div key={item.id} className="sel-item">
                  <div className="sel-body">
                    <div className="sel-name">{name}</div>
                    <div className="sel-price">
                      {finalP !== item.price && <span className="sel-orig">{fmt(item.price)}</span>}
                      {fmt(finalP)}
                    </div>
                    {(mDiff > 0 || cDiff > 0) && (
                      <div className="sel-discount">
                        {[
                          mDiff > 0 ? t('memDisc')(fmt(mDiff)) : null,
                          cDiff > 0 ? t('addDisc')(customDiscount, fmt(cDiff)) : null
                        ].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                  <button className="sel-remove" onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }}>×</button>
                </div>
              );
            })
          )}
        </div>

        <div className="panel-rule">
          <span className="pr-line"></span><span className="pr-gem">◆</span><span className="pr-line"></span>
        </div>

        <div className="discount-zone">
          <h3 className="zone-title">{t('zoneTitle')}</h3>
          
          <div className="membership-row">
            <div className="membership-txt">
              <span className="mem-name">A Membership</span>
              <span className="mem-desc">{t('memDesc')}</span>
            </div>
            <label className="toggle-wrap">
              <input type="checkbox" checked={membershipOn} onChange={e => setMembershipOn(e.target.checked)} />
              <span className="toggle-track"><span className="toggle-knob"></span></span>
            </label>
          </div>

          <div className="rate-row">
            <span className="rate-lbl">{t('rateLbl')}</span>
            <div className="rate-ctrl">
              <button className="rate-btn" onClick={() => setCustomDiscount(Math.max(0, customDiscount - 5))}>−</button>
              <span className="rate-val">
                <span>{customDiscount}</span><span className="rate-pct">%</span>
              </span>
              <button className="rate-btn" onClick={() => setCustomDiscount(Math.min(50, customDiscount + 5))}>+</button>
            </div>
          </div>

          <div className="breakdown">
            {memDisc > 0 && (
              <div className="bk-row">
                <span>{t('membership')} {currentLang === 'ko' ? '할인' : 'Discount'}</span>
                <span className="bk-amt">−{fmt(memDisc)}</span>
              </div>
            )}
            {customDisc > 0 && (
              <div className="bk-row">
                <span>{t('extra')} {customDiscount}% {currentLang === 'ko' ? '할인' : 'Discount'}</span>
                <span className="bk-amt">−{fmt(customDisc)}</span>
              </div>
            )}
            {totalDisc > 0 && (
              <div className="bk-row bk-total-row">
                <span style={{fontWeight: 600}}>{t('totalRate')}</span>
                <span className="bk-amt" style={{color: '#E08888'}}>−{totalRate}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="panel-rule">
          <span className="pr-line"></span><span className="pr-gem">◆</span><span className="pr-line"></span>
        </div>

        <div className="total-zone">
          <div className="total-row">
            <span className="total-lbl">{t('subtotalLbl')}</span>
            <span className="total-val">{list.length > 0 ? fmt(subtotal) : '—'}</span>
          </div>
          {totalDisc > 0 && (
            <div className="total-row disc-row">
              <span className="total-lbl">
                {t('discLabel')([
                  memDisc > 0 ? t('membership') : null,
                  customDisc > 0 ? `${t('extra')} ${customDiscount}%` : null
                ].filter(Boolean))}
              </span>
              <span className="total-val disc-val">−{fmt(totalDisc)}</span>
            </div>
          )}
          {totalTime > 0 && (
            <div className="total-row" style={{ marginTop: '8px', color: 'var(--txt-70)', fontSize: 'var(--fs-sm)' }}>
              <span className="total-lbl">{currentLang === 'ko' ? '예상 소요 시간' : (currentLang === 'zh' ? '预计时间' : 'Est. Time')}</span>
              <span className="total-val">{totalTimeStr}</span>
            </div>
          )}
          <div className="grand-row">
            <span className="grand-lbl">{t('totalLbl')}</span>
            <span className="grand-val">{list.length > 0 ? fmt(finalTotal) : '—'}</span>
          </div>
        </div>

        <button 
          className="proceed-btn" 
          disabled={list.length === 0}
          onClick={onProceed}
        >
          {currentLang === 'ko' ? '서명하기' : (currentLang === 'zh' ? '签名' : 'Sign')}
        </button>

        <div className="mem-info-card">
          <div className="mic-header">{t('micHeader')}</div>
          <div className="mic-body">
            <p dangerouslySetInnerHTML={{ __html: t('micP1') }}></p>
            <div className="mic-grid">
              <div className="mic-row">
                <span className="mic-dot">◆</span>
                <span>{t('micRow1')}</span>
                <strong>10% OFF</strong>
              </div>
              <div className="mic-row">
                <span className="mic-dot">◆</span>
                <span>{t('micRow2')}</span>
                <strong>15% OFF</strong>
              </div>
            </div>
            <p className="mic-note">{t('micNote')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

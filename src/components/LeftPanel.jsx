import React, { useRef } from "react";
import MenuCard from "./MenuCard";
import SecretHistoryButton from "./SecretHistoryButton";

export default function LeftPanel({
  currentLang,
  currentCat,
  setCurrentCat,
  selectedIds,
  toggleItem,
  onOpenLookbook,
  T,
  MENU_DATA,
  CATEGORIES,
}) {
  const items = MENU_DATA.filter((i) => i.category === currentCat);
  const navRef = useRef(null);
  const touchStart = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e) => {
    touchStart.current = {
      x: e.changedTouches[0].screenX,
      y: e.changedTouches[0].screenY,
    };
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;

    const diffX = touchEndX - touchStart.current.x;
    const diffY = touchEndY - touchStart.current.y;
    const SWIPE_THRESHOLD = 60;

    if (
      Math.abs(diffX) > Math.abs(diffY) &&
      Math.abs(diffX) > SWIPE_THRESHOLD
    ) {
      const cats = CATEGORIES.map((c) => c.id);
      const currIdx = cats.indexOf(currentCat);

      if (diffX < 0) {
        if (currIdx < cats.length - 1) switchCat(cats[currIdx + 1]);
      } else {
        if (currIdx > 0) switchCat(cats[currIdx - 1]);
      }
    }
  };

  const switchCat = (catId) => {
    setCurrentCat(catId);
    if (navRef.current) {
      // Need a small timeout to let React render the active class first, though scrollIntoView on the element itself might work immediately
      setTimeout(() => {
        if (!navRef.current) return;
        const activeTab = navRef.current.querySelector(
          `.cat-tab[data-cat="${catId}"]`,
        );
        if (activeTab) {
          activeTab.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }, 0);
    }
  };

  return (
    <div className="left-panel">
      <header className="brand-header">
        <div className="logo-wrap">
          <SecretHistoryButton>
            <img
              src="/logo2.png"
              alt="Aaron's Roll N Comb Hair Salon"
              className="brand-logo-img"
            />
          </SecretHistoryButton>
        </div>
        <div className="header-rule">
          <span className="rule-line"></span>
          <span className="rule-diamond">◆</span>
          <span className="rule-line"></span>
        </div>
        <p className="brand-location">
          Grand InterContinental Seoul Parnas · 삼성동 파르나스몰
        </p>
      </header>

      <nav className="category-nav" ref={navRef}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            data-cat={cat.id}
            className={`cat-tab ${currentCat === cat.id ? "active" : ""}`}
            onClick={() => switchCat(cat.id)}
          >
            {currentLang === "ko"
              ? cat.name_ko
              : currentLang === "zh"
                ? cat.name_zh
                : cat.name_en}
          </button>
        ))}
      </nav>

      <div
        className="menu-list"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item, idx) => (
          <MenuCard
            key={item.id}
            item={item}
            idx={idx}
            currentLang={currentLang}
            isSelected={selectedIds.has(item.id)}
            toggleItem={toggleItem}
            onOpenLookbook={onOpenLookbook}
            T={T}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
//   Aaron's Roll N Comb — app.js
//   Bilingual (KO / EN) Interactive Menu
// ============================================================

// ── 언어 상태 ──
let currentLang = 'ko'; // 'ko' | 'en'

// ── UI 문자열 번역 ──
const T = {
  ko: {
    summaryTitle:    '선택 내역',
    countSuffix:     '개 선택',
    countNone:       '0개 선택',
    emptyTxt:        '서비스를 선택해 주세요',
    emptySub:        '메뉴를 터치하면 합계에 추가됩니다',
    zoneTitle:       '멤버십 / 할인 적용',
    memDesc:         '컷·드라이 10% / 펌·염색 15% 할인',
    rateLbl:         '추가 할인율',
    subtotalLbl:     '소계',
    totalLbl:        '합계',
    discountLbl:     '할인',
    membership:      '멤버십',
    extra:           '추가',
    totalRate:       '총 할인율',
    resetBtn:        '↺ 전체 초기화',
    micHeader:       'A Membership 안내사항',
    micP1:           '선불권 멤버십 가입 시 최대 <strong>10~15% 할인</strong> 적용',
    micRow1:         '컷 · 드라이',
    micRow2:         '펌 · 염색',
    micNote:         '※ 부분 시술, 클리닉은 멤버십 할인 제외',
    tagMemOff:       '멤버십 제외',
    tagLenExtra:     '기장 추가 별도',
    tagTime:         (t) => `⏱ ${t}`,
    memDisc:         (a) => `멤버십 −${a}`,
    addDisc:         (r, a) => `추가 ${r}% −${a}`,
    discLabel:       (parts) => parts.join(' + ') + ' 할인',
  },
  en: {
    summaryTitle:    'Selection',
    countSuffix:     ' item(s)',
    countNone:       '0 items',
    emptyTxt:        'Please select a service',
    emptySub:        'Tap a service to add to your total',
    zoneTitle:       'Membership & Discount',
    memDesc:         'Cut·Dry 10% / Perm·Color 15% off',
    rateLbl:         'Extra Discount',
    subtotalLbl:     'Subtotal',
    totalLbl:        'Total',
    discountLbl:     'Discount',
    membership:      'Membership',
    extra:           'Extra',
    totalRate:       'Total Discount',
    resetBtn:        '↺ Reset All',
    micHeader:       'A Membership Info',
    micP1:           'Prepaid membership: up to <strong>10–15% discount</strong>',
    micRow1:         'Cut · Dry',
    micRow2:         'Perm · Color',
    micNote:         '※ Partial treatments & clinic excluded',
    tagMemOff:       'Non-member',
    tagLenExtra:     'Length surcharge',
    tagTime:         (t) => `⏱ ${t}`,
    memDisc:         (a) => `Membership −${a}`,
    addDisc:         (r, a) => `Extra ${r}% −${a}`,
    discLabel:       (parts) => parts.join(' + ') + ' Discount',
  }
};

// ── 메뉴 데이터 (한/영 모두 포함) ──
const MENU_DATA = [
  // ═══ 컷 ═══
  {
    id: 'cut_women', category: 'cut',
    name:   { ko: '1:1 맞춤 원장 여성컷',      en: "Director's Women's Cut" },
    badge:  'Director', time: { ko: '1시간', en: '1 hr' },
    price: 50000,
    desc:   { ko: '디테일한 상담과 꼼꼼한 시술로 손질이 편한 스타일을 만들어 드립니다.',
              en: 'Detailed consultation and meticulous styling for an easy-to-manage look.' },
    membershipEligible: true, membershipRate: 10,
  },
  {
    id: 'cut_men', category: 'cut',
    name:   { ko: '1:1 맞춤 원장 남성컷',      en: "Director's Men's Cut" },
    badge:  'Director', time: { ko: '30분', en: '30 min' },
    price: 45000,
    desc:   { ko: '두상 형태에 따른 최적의 스타일을 선물해 드립니다.',
              en: 'The perfect style tailored to your head shape.' },
    membershipEligible: true, membershipRate: 10,
  },
  {
    id: 'cut_junior', category: 'cut',
    name:   { ko: '1:1 원장 주니어컷',         en: "Director's Junior Cut" },
    badge:  'Junior', time: { ko: '30분', en: '30 min' },
    price: 40000,
    desc:   { ko: '아이에게 트렌디한 스타일을 선물합니다.',
              en: 'A trendy, fun style gifted to your little one.' },
    membershipEligible: true, membershipRate: 10,
  },

  // ═══ 펌 ═══
  {
    id: 'perm_repair', category: 'perm',
    name:   { ko: '리페어 복구펌',              en: 'Repair Reconstruction Perm' },
    badge:  'Signature', time: { ko: '3시간', en: '3 hrs' },
    price: 350000,
    desc:   { ko: '더이상 손상을 주는 펌은 그만! 모발에 내구성을 구축하여 최상의 컨디션으로 만들어 드립니다.',
              en: 'No more damage. Rebuilds hair resilience for peak condition.' },
    membershipEligible: true, membershipRate: 15, lengthExtra: true,
  },
  {
    id: 'perm_magic_set', category: 'perm',
    name:   { ko: '프리미엄 매직 + 셋팅',       en: 'Premium Magic & Setting' },
    badge:  'Premium', time: { ko: '2시간', en: '2 hrs' },
    price: 300000,
    desc:   { ko: '악성곱슬, 뿌리교정, 볼륨 모발끝 디자인을 한 번에 진행해 드립니다.',
              en: 'Severe curls, root correction, and volume end design — all in one.' },
    membershipEligible: true, membershipRate: 15, lengthExtra: true,
  },
  {
    id: 'perm_volume_magic', category: 'perm',
    name:   { ko: '프리미엄 볼륨매직',          en: 'Premium Volume Magic' },
    badge:  'Premium', time: { ko: '2시간', en: '2 hrs' },
    price: 280000,
    desc:   { ko: '부스스한 곱슬머리를 매끄럽고 윤기나게 변신시켜 드립니다.',
              en: 'Transforms frizzy curls into smooth, luminous hair.' },
    membershipEligible: true, membershipRate: 15, lengthExtra: true,
  },
  {
    id: 'perm_setting_digital', category: 'perm',
    name:   { ko: '프리미엄 셋팅 & 디지털',     en: 'Premium Setting & Digital' },
    badge:  'Premium', time: { ko: '2시간', en: '2 hrs' },
    price: 270000,
    desc:   { ko: '말릴수록 예쁘고 손질이 편한 스타일로 만들어 드립니다.',
              en: 'Looks better the more it dries — effortless every day.' },
    membershipEligible: true, membershipRate: 15, lengthExtra: true,
  },
  {
    id: 'perm_hippie', category: 'perm',
    name:   { ko: '히피펌 / 직펌',              en: 'Hippie Perm / Straight Perm' },
    time: { ko: '1시간 30분', en: '1.5 hrs' },
    price: 240000,
    desc:   { ko: '특수펌으로 최소한의 시간에 열펌 같은 효과를 보실 수 있습니다.',
              en: 'Specialty perm achieving heat-perm results in minimal time.' },
    membershipEligible: true, membershipRate: 15, lengthExtra: true,
  },
  {
    id: 'perm_protein', category: 'perm',
    name:   { ko: '프리미엄 단백질펌',          en: 'Premium Protein Perm' },
    badge:  'Premium', time: { ko: '1시간 30분', en: '1.5 hrs' },
    price: 180000,
    desc:   { ko: '드라이 손질이 쉽고 최상의 볼륨을 선물해 드립니다.',
              en: 'Easy blow-dry and outstanding volume — every single day.' },
    membershipEligible: true, membershipRate: 15, lengthExtra: true,
  },
  {
    id: 'perm_basic', category: 'perm',
    name:   { ko: '베이직 펌',                  en: 'Basic Perm' },
    time: { ko: '1시간', en: '1 hr' },
    price: 150000,
    desc:   { ko: '남성 다운펌 포함 베이직 펌',  en: 'Classic perm including men\'s down perm.' },
    subItems: { ko: ['가일펌', '포마드펌', '시스루펌'], en: ['Gail Perm', 'Pomade Perm', 'See-through Perm'] },
    membershipEligible: true, membershipRate: 15, lengthExtra: true,
  },
  {
    id: 'perm_partial', category: 'perm',
    name:   { ko: '부분 시술',                  en: 'Partial Treatment' },
    time: { ko: '30분', en: '30 min' },
    price: 60000,
    desc:   { ko: '앞머리, 애교머리, 탑볼륨 등 필요한 위치만 시술. 부위·방법·약제에 따라 추가 비용 발생.',
              en: 'Targeted treatment for bangs, face-frame, or top volume. Additional fees may apply by area.' },
    membershipEligible: false,
  },

  // ═══ 염색 ═══
  {
    id: 'color_root_premium', category: 'color',
    name:   { ko: '프리미엄 뿌리염색',          en: 'Premium Root Color' },
    badge:  'Premium', time: { ko: '1시간', en: '1 hr' },
    price: 100000,
    desc:   { ko: '뿌리염색 + 두피보호제 | 2cm 미만 | 멋내기 & 새치커버 가능',
              en: 'Root color + scalp protector | Under 2cm | Fashion & grey coverage' },
    membershipEligible: true, membershipRate: 15,
  },
  {
    id: 'color_full_premium', category: 'color',
    name:   { ko: '프리미엄 전체염색',          en: 'Premium Full Color' },
    badge:  'Premium', time: { ko: '1시간', en: '1 hr' },
    price: 150000,
    desc:   { ko: '저자극 제품 | 염색 + 두피보호제 + 두피 진정팩',
              en: 'Low-irritant formula | Color + scalp protector + soothing pack' },
    membershipEligible: true, membershipRate: 15, lengthExtra: true,
  },
  {
    id: 'color_organic_root', category: 'color',
    name:   { ko: '오가닉 뿌리염색',            en: 'Organic Root Color' },
    badge:  'Organic', time: { ko: '1시간', en: '1 hr' },
    price: 150000,
    desc:   { ko: '민감한 두피에 천연 제품으로 자극 없이 염색해 드립니다.',
              en: 'Natural ingredients for sensitive scalps — irritation-free color.' },
    subItems: { ko: ['와칸 염색', '헤나', '오징어 먹물'], en: ['Wakan Color', 'Henna', 'Squid Ink'] },
    membershipEligible: true, membershipRate: 15,
  },
  {
    id: 'color_organic_full', category: 'color',
    name:   { ko: '오가닉 전체 염색',           en: 'Organic Full Color' },
    badge:  'Organic', time: { ko: '1시간', en: '1 hr' },
    price: 180000,
    desc:   { ko: '두피보호제 + 두피진정제 포함 | 천연 성분으로 자극 없이',
              en: 'Scalp protector + soothing serum included | Natural & gentle' },
    subItems: { ko: ['와칸 염색', '헤나', '오징어 먹물'], en: ['Wakan Color', 'Henna', 'Squid Ink'] },
    membershipEligible: true, membershipRate: 15, lengthExtra: true,
  },
  {
    id: 'color_bleach_partial', category: 'color',
    name:   { ko: '블리치 — 부분',              en: 'Bleach — Partial' },
    time: { ko: '1시간 30분', en: '1.5 hrs' },
    price: 150000,
    membershipEligible: true, membershipRate: 15, lengthExtra: true,
  },
  {
    id: 'color_bleach_full', category: 'color',
    name:   { ko: '블리치 — 전체',              en: 'Bleach — Full' },
    time: { ko: '1시간 30분', en: '1.5 hrs' },
    price: 180000,
    desc:   { ko: '1회 블리치 & 보색바스',       en: '1-round bleach & toning bath' },
    membershipEligible: true, membershipRate: 15, lengthExtra: true,
  },
  {
    id: 'color_gradient', category: 'color',
    name:   { ko: '투톤 / 그라데이션 / 버라이어티', en: 'Two-Tone / Gradient / Variety' },
    badge:  'Signature', time: { ko: '3시간', en: '3 hrs' },
    price: 300000,
    desc:   { ko: '탈색 + 컬러 + 클리닉 구성',   en: 'Bleach + color + clinic package' },
    membershipEligible: true, membershipRate: 15, lengthExtra: true,
  },

  // ═══ 클리닉 ═══
  {
    id: 'clinic_spa_hair', category: 'clinic',
    name:   { ko: '헤드스파 + 모발클리닉',       en: 'Head Spa & Hair Clinic' },
    badge:  'Signature', time: { ko: '1시간', en: '1 hr' },
    price: 250000,
    desc:   { ko: '두피 유수분 밸런스와 모발 영양 보충으로 전체적인 헤어 컨디션을 높이는 시그니처 프로그램.',
              en: 'Signature program balancing scalp hydration and replenishing hair nutrition.' },
    membershipEligible: false,
  },
  {
    id: 'clinic_spa', category: 'clinic',
    name:   { ko: '헤드스파 클리닉',             en: 'Head Spa Clinic' },
    time: { ko: '1시간', en: '1 hr' },
    price: 150000,
    desc:   { ko: '두피 속 묵은 각질과 잔여물을 제거하고 마사지를 통해 건강한 두피를 만드는 클리닉.',
              en: 'Deep cleansing of buildup and massage therapy for a healthier scalp.' },
    membershipEligible: false,
  },
  {
    id: 'clinic_hair', category: 'clinic',
    name:   { ko: '모발 클리닉',                 en: 'Hair Clinic' },
    time: { ko: '1시간', en: '1 hr' },
    price: 150000,
    desc:   { ko: '모발 상태를 진단하여 필요한 주성분을 공급, 매끄럽고 윤기나는 모발을 만들어 드립니다.',
              en: 'Diagnoses your hair condition and delivers targeted ingredients for silky, glossy results.' },
    membershipEligible: false, lengthExtra: true,
  },
  {
    id: 'clinic_keratin', category: 'clinic',
    name:   { ko: '신데렐라 케라틴 복구 클리닉',  en: 'Cinderella Keratin Repair' },
    badge:  'Special', time: { ko: '1시간', en: '1 hr' },
    price: 350000,
    desc:   { ko: '탈색·극손상·녹은 머리에 강추. 단백질을 입혀 윤기나고 찰랑거리는 모발로 재탄생.',
              en: 'Ideal for bleached or severely damaged hair. Protein coating for lustrous, bouncy strands.' },
    membershipEligible: false, lengthExtra: true,
  },

  // ═══ 드라이 ═══
  {
    id: 'dry_basic', category: 'dry',
    name:   { ko: '베이직 드라이 & 스타일링',    en: 'Basic Blowout & Styling' },
    price: 35000,
    membershipEligible: true, membershipRate: 10,
  },
  {
    id: 'dry_magic', category: 'dry',
    name:   { ko: '매직 / 아이롱 셋팅 드라이',   en: 'Magic / Iron Setting Blowout' },
    time: { ko: '1시간', en: '1 hr' },
    price: 40000,
    membershipEligible: false,
  },
  {
    id: 'dry_extension', category: 'dry',
    name:   { ko: '붙임머리 / 특수머리 드라이',   en: 'Extension / Specialty Blowout' },
    time: { ko: '1시간', en: '1 hr' },
    price: 60000,
    membershipEligible: false,
  },

  // ═══ 샴푸 ═══
  {
    id: 'shampoo_basic', category: 'shampoo',
    name:   { ko: '베이직 바스 / SHAMPOO',       en: 'Basic Shampoo' },
    time: { ko: '30분', en: '30 min' },
    price: 20000,
    desc:   { ko: '베이직 샴푸',                  en: 'Standard shampoo service' },
    membershipEligible: false,
  },
  {
    id: 'shampoo_premium', category: 'shampoo',
    name:   { ko: '프리미엄 바스 / SHAMPOO',      en: 'Premium Shampoo' },
    time: { ko: '1시간', en: '1 hr' },
    price: 60000,
    desc:   { ko: '붙임머리, 드레드, 레게 익스텐션 특수머리 전용 샴푸',
              en: 'Specialized shampoo for extensions, dreadlocks, and reggae styles.' },
    membershipEligible: false,
  },
];

// ── 상태 ──
let selectedIds    = new Set();
let membershipOn   = false;
let customDiscount = 0;
let currentCat     = 'cut';

// ── DOM ──
const $menuList         = document.getElementById('menuList');
const $categoryNav      = document.getElementById('categoryNav');
const $selectedList     = document.getElementById('selectedList');
const $emptyState       = document.getElementById('emptyState');
const $membershipToggle = document.getElementById('membershipToggle');
const $summaryCount     = document.getElementById('summaryCount');
const $subtotal         = document.getElementById('subtotalDisplay');
const $discountDisplay  = document.getElementById('discountDisplay');
const $discountLabel    = document.getElementById('discountLabel');
const $total            = document.getElementById('totalDisplay');
const $discountRow      = document.getElementById('discountRow');
const $breakdown        = document.getElementById('discountBreakdown');
const $discountVal      = document.getElementById('discountValue');
const $resetBtn         = document.getElementById('resetBtn');
const $langToggle       = document.getElementById('langToggle');
const $langKo           = document.getElementById('langKo');
const $langEn           = document.getElementById('langEn');

// ── 유틸 ──
const fmt      = n => n.toLocaleString('ko-KR');
const t        = (key) => T[currentLang][key];
const getLang  = (obj) => typeof obj === 'string' ? obj : (obj[currentLang] || obj.ko);
const getMemRate = item => (!membershipOn || !item.membershipEligible) ? 0 : (item.membershipRate || 0);
const getItemFinal = item => {
  const afterMem = Math.round(item.price * (1 - getMemRate(item) / 100));
  return Math.round(afterMem * (1 - customDiscount / 100));
};

// ── 언어 전환 ──
function applyLang() {
  // 카테고리 탭 텍스트
  $categoryNav.querySelectorAll('.cat-tab').forEach(btn => {
    btn.textContent = btn.dataset[currentLang] || btn.dataset.ko;
  });

  // data-ko / data-en 속성이 있는 정적 요소 일괄 업데이트
  document.querySelectorAll('[data-ko]').forEach(el => {
    const val = el.dataset[currentLang] || el.dataset.ko;
    // innerHTML 사용 (strong 태그 포함 가능)
    if (val && val.includes('<')) el.innerHTML = val;
    else if (val) el.textContent = val;
  });

  // 언어 버튼 active 표시
  $langKo.classList.toggle('active', currentLang === 'ko');
  $langEn.classList.toggle('active', currentLang === 'en');

  // 카운트 업데이트
  updateCount();

  // 메뉴 & 요약 재렌더
  renderMenu();
  renderSummary();
}

function updateCount() {
  const n = selectedIds.size;
  if (currentLang === 'ko') {
    $summaryCount.textContent = n > 0 ? `${n}개 선택` : '0개 선택';
  } else {
    $summaryCount.textContent = n > 0 ? `${n} item${n > 1 ? 's' : ''}` : '0 items';
  }
}

// ── 메뉴 렌더 ──
function renderMenu() {
  $menuList.innerHTML = '';
  const items = MENU_DATA.filter(i => i.category === currentCat);
  const lang  = currentLang;

  items.forEach((item, idx) => {
    const sel  = selectedIds.has(item.id);
    const card = document.createElement('div');
    card.className = 'menu-card' + (sel ? ' selected' : '');
    card.dataset.id = item.id;
    card.style.animationDelay = `${idx * 0.04}s`;

    const name = getLang(item.name);
    const time = item.time ? getLang(item.time) : null;
    const desc = item.desc ? getLang(item.desc) : null;

    // 서브 아이템
    let subHtml = '';
    if (item.subItems) {
      const subs = Array.isArray(item.subItems) ? item.subItems : getLang(item.subItems);
      subHtml = `<div class="card-subs">${subs.map(s=>`<span class="card-sub">${s}</span>`).join('')}</div>`;
    }

    // 태그
    const timeTag = time ? `<span class="time-tag">${t('tagTime')(time)}</span>` : '';
    const badgeTag = item.badge ? `<span class="badge badge-gold">${item.badge}</span>` : '';
    const memOffTag = !item.membershipEligible ? `<span class="badge badge-mem-off">${t('tagMemOff')}</span>` : '';
    const lenTag = item.lengthExtra ? `<span class="badge badge-extra">${t('tagLenExtra')}</span>` : '';

    card.innerHTML = `
      <div class="card-check"><div class="card-check-dot"></div></div>
      <div class="card-top">
        <div class="card-name">${name}</div>
        <div class="card-price-col">
          <div class="card-price">${fmt(item.price)}</div>
        </div>
      </div>
      <div class="card-meta">${timeTag}${badgeTag}${memOffTag}${lenTag}</div>
      ${desc ? `<div class="card-desc">${desc}</div>` : ''}
      ${subHtml}
    `;

    card.addEventListener('click', () => toggle(item.id));
    $menuList.appendChild(card);
  });
}

// ── 토글 ──
function toggle(id) {
  const targetItem = MENU_DATA.find(item => item.id === id);
  if (!targetItem) return;

  if (selectedIds.has(id)) {
    selectedIds.delete(id);
    const cardEl = $menuList.querySelector(`[data-id="${id}"]`);
    if (cardEl) cardEl.classList.remove('selected');
  } else {
    selectedIds.forEach(selectedId => {
      const item = MENU_DATA.find(i => i.id === selectedId);
      if (item && item.category === targetItem.category) {
        selectedIds.delete(selectedId);
        const cardEl = $menuList.querySelector(`[data-id="${selectedId}"]`);
        if (cardEl) cardEl.classList.remove('selected');
      }
    });
    selectedIds.add(id);
    const cardEl = $menuList.querySelector(`[data-id="${id}"]`);
    if (cardEl) cardEl.classList.add('selected');
  }
  renderSummary();
  updateCount();
}

// ── 요약 렌더 ──
function renderSummary() {
  const list = MENU_DATA.filter(i => selectedIds.has(i.id));

  if (list.length === 0) {
    $selectedList.innerHTML = '';
    $selectedList.appendChild($emptyState);
    $subtotal.textContent = '—';
    $total.textContent = '—';
    $discountRow.style.display = 'none';
    $breakdown.innerHTML = '';
    return;
  }

  $selectedList.innerHTML = '';
  let subtotal = 0, memDisc = 0, customDisc = 0;

  list.forEach(item => {
    subtotal += item.price;
    const mRate   = getMemRate(item);
    const afterMem = Math.round(item.price * (1 - mRate / 100));
    const mDiff   = item.price - afterMem;
    const cDiff   = Math.round(afterMem * customDiscount / 100);
    memDisc   += mDiff;
    customDisc += cDiff;

    const finalP = getItemFinal(item);
    const name   = getLang(item.name);

    const priceStr = finalP !== item.price
      ? `<span class="sel-orig">${fmt(item.price)}</span>${fmt(finalP)}`
      : fmt(finalP);

    let discStr = '';
    if (mDiff > 0 || cDiff > 0) {
      const parts = [];
      if (mDiff > 0) parts.push(t('memDisc')(fmt(mDiff)));
      if (cDiff > 0) parts.push(t('addDisc')(customDiscount, fmt(cDiff)));
      discStr = `<div class="sel-discount">${parts.join(' · ')}</div>`;
    }

    const el = document.createElement('div');
    el.className = 'sel-item';
    el.innerHTML = `
      <div class="sel-body">
        <div class="sel-name">${name}</div>
        <div class="sel-price">${priceStr}</div>
        ${discStr}
      </div>
      <button class="sel-remove" data-id="${item.id}">×</button>
    `;
    el.querySelector('.sel-remove').addEventListener('click', e => {
      e.stopPropagation();
      toggle(item.id);
    });
    $selectedList.appendChild(el);
  });

  const totalDisc  = memDisc + customDisc;
  const finalTotal = subtotal - totalDisc;

  $subtotal.textContent = fmt(subtotal);

  if (totalDisc > 0) {
    $discountRow.style.display = 'flex';
    const parts = [];
    if (memDisc > 0)   parts.push(t('membership'));
    if (customDisc > 0) parts.push(`${t('extra')} ${customDiscount}%`);
    $discountLabel.textContent = t('discLabel')(parts);
    $discountDisplay.textContent = `−${fmt(totalDisc)}`;
  } else {
    $discountRow.style.display = 'none';
  }

  $total.textContent = fmt(finalTotal);

  // 할인 내역 상세
  $breakdown.innerHTML = '';
  if (memDisc > 0) {
    addBkRow(t('membership') + (currentLang === 'ko' ? ' 할인' : ' Discount'), fmt(memDisc));
  }
  if (customDisc > 0) {
    addBkRow(`${t('extra')} ${customDiscount}% ${currentLang === 'ko' ? '할인' : 'Discount'}`, fmt(customDisc));
  }
  if (totalDisc > 0) {
    const rate = ((totalDisc / subtotal) * 100).toFixed(1);
    const r = document.createElement('div');
    r.className = 'bk-row bk-total-row';
    r.innerHTML = `<span style="font-weight:600">${t('totalRate')}</span><span class="bk-amt" style="color:#E08888">−${rate}%</span>`;
    $breakdown.appendChild(r);
  }
}

function addBkRow(label, amt) {
  const r = document.createElement('div');
  r.className = 'bk-row';
  r.innerHTML = `<span>${label}</span><span class="bk-amt">−${amt}</span>`;
  $breakdown.appendChild(r);
}

// ── 이벤트 ──

// 카테고리 전환 공통 함수
function switchCategory(cat) {
  currentCat = cat;
  $categoryNav.querySelectorAll('.cat-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
  renderMenu();
  
  // 탭바가 스크롤 영역 밖으로 밀려나면 자동 스크롤
  const activeTab = $categoryNav.querySelector('.cat-tab.active');
  if (activeTab) {
    activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

// 카테고리 탭 클릭 이벤트
$categoryNav.querySelectorAll('.cat-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    switchCategory(btn.dataset.cat);
  });
});

// 터치 스와이프 감지
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const SWIPE_THRESHOLD = 60; // 스와이프 최소 드래그 임계값 (px)

$menuList.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

$menuList.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;
  handleSwipe();
}, { passive: true });

function handleSwipe() {
  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;

  // 가로 드래그가 세로 드래그보다 크고, 최소 드래그 임계값을 넘을 경우
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > SWIPE_THRESHOLD) {
    const tabs = Array.from($categoryNav.querySelectorAll('.cat-tab'));
    const cats = tabs.map(btn => btn.dataset.cat);
    const currIdx = cats.indexOf(currentCat);

    if (diffX < 0) {
      // 왼쪽으로 스와이프 -> 다음 카테고리
      if (currIdx < cats.length - 1) {
        switchCategory(cats[currIdx + 1]);
      }
    } else {
      // 오른쪽으로 스와이프 -> 이전 카테고리
      if (currIdx > 0) {
        switchCategory(cats[currIdx - 1]);
      }
    }
  }
}

// 멤버십
$membershipToggle.addEventListener('change', () => {
  membershipOn = $membershipToggle.checked;
  renderMenu();
  renderSummary();
});

// 할인율
document.getElementById('discountMinus').addEventListener('click', () => {
  if (customDiscount > 0) {
    customDiscount = Math.max(0, customDiscount - 5);
    $discountVal.textContent = customDiscount;
    renderSummary();
  }
});
document.getElementById('discountPlus').addEventListener('click', () => {
  if (customDiscount < 50) {
    customDiscount = Math.min(50, customDiscount + 5);
    $discountVal.textContent = customDiscount;
    renderSummary();
  }
});

// 초기화
$resetBtn.addEventListener('click', () => {
  selectedIds.clear();
  membershipOn = false;
  $membershipToggle.checked = false;
  customDiscount = 0;
  $discountVal.textContent = 0;
  renderMenu();
  renderSummary();
  updateCount();
});

// 언어 전환
$langToggle.addEventListener('click', () => {
  currentLang = currentLang === 'ko' ? 'en' : 'ko';
  applyLang();
});

// ── 초기 실행 ──
$langKo.classList.add('active');
renderMenu();
renderSummary();
